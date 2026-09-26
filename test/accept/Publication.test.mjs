import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http2 from 'node:http2';
import {parseDocument} from 'yaml';
import {marked} from 'marked';
import Source from '../../src/Back/Publication/Source.mjs';
import Catalog from '../../src/Back/Publication/Catalog.mjs';
import Handler from '../../src/Back/Publication/Handler.mjs';
import Plugin from '../../src/Back/Cli/Plugin.mjs';
import Pipeline from '../../node_modules/@teqfw/web/src/Back/PipelineEngine.mjs';
import Kahn from '../../node_modules/@teqfw/web/src/Back/Helper/Order/Kahn.mjs';
import Respond from '../../node_modules/@teqfw/web/src/Back/Helper/Respond.mjs';

const locales = ['en', 'de', 'ru'];
const family = {prefix: 'journal', presentation: 'publication.html'};
const logger = {forSource: () => ({error() {}, info() {}, warn() {}})};
const info = {create: value => value};
const STAGE = {INIT: 'INIT', PROCESS: 'PROCESS', FINALIZE: 'FINALIZE'};

function response() {
    return {
        status: undefined, headers: {}, body: '', headersSent: false, writableEnded: false,
        writeHead(status, headers = {}) { this.status = status; this.headers = headers; this.headersSent = true; },
        end(body = '') { this.body = body; this.writableEnded = true; },
    };
}

async function fixture() {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'teq-cms-publication-'));
    const tmplConfig = {
        getRootPath: () => root,
        getAvailableLocales: () => locales,
        getDefaultLocale: () => 'de',
    };
    const config = {
        getPublicationFamilies: () => [family],
        getPublicationMachineLocales: () => ['en'],
        getAgentMessageEnabled: () => false,
        getBaseUrl: () => 'https://example.test',
    };
    const source = new Source({fs, path, tmplConfig, config, parseDocument, marked});
    const catalog = new Catalog({fs, path, tmplConfig, config, source});
    const respond = new Respond({http2});
    const rendered = [];
    const handler = new Handler({
        config, tmplConfig, source, respond, dtoInfo: info, STAGE, logger, path,
        dtoTarget: {create: value => value},
        render: {perform: async value => {
            rendered.push(value);
            return {resultCode: 'SUCCESS', content: `<article>${value.data.publication.html}</article>`};
        }},
    });
    const calls = [];
    const staticHandler = {
        init: async () => {},
        getRegistrationInfo: () => ({name: 'TeqFw_Web_Back_Handler_Static', stage: STAGE.PROCESS}),
        handle: async () => { calls.push('static'); },
    };
    const templateHandler = {
        getRegistrationInfo: () => ({name: 'Fl32_Cms_Back_Web_Handler_Template', stage: STAGE.PROCESS, before: ['TeqFw_Web_Back_Handler_Static']}),
        handle: async () => { calls.push('template'); },
    };
    const pipeline = new Pipeline({
        dtoRequestContextFactory: {create: () => ({})}, logger, respond, helpOrder: new Kahn(), STAGE,
    });
    const plugin = new Plugin({
        pipeline, handLog: {getRegistrationInfo: () => ({name: 'log', stage: STAGE.INIT}), handle: async () => {}},
        handStatic: staticHandler, handTmpl: templateHandler, handPublication: handler,
        handAgentMessage: {},
        dtoSource: {create: value => value}, tmplConfig, config, path,
    });
    await plugin.onStartup();
    pipeline.lockHandlers();
    const send = async url => {
        const res = response();
        await pipeline.onEventRequest({url, headers: {}}, res);
        return res;
    };
    const write = async (locale, route, text) => {
        const file = path.join(root, 'tmpl', 'web', locale, `${route}.md`);
        await fs.mkdir(path.dirname(file), {recursive: true});
        await fs.writeFile(file, text);
    };
    return {root, source, catalog, rendered, calls, send, write};
}

describe('Markdown publication through the CMS plugin and web pipeline', () => {
    it('serves three localized HTML routes and the configured Markdown corpus', async () => {
        const app = await fixture();
        try {
            for (const locale of locales) {
                await app.write(locale, 'journal/2026/hello', `---\ntitle: ${locale} title\ndescription: ${locale} description\ndate: 2026-09-23\n---\n# ${locale} body\n`);
            }
            await app.write('en', 'journal/2025/first', '---\ntitle: First\ndescription: First item\ndate: 2025-01-01\n---\nFirst body.\n');
            for (const locale of locales) {
                const result = await app.send(`/${locale}/journal/2026/hello`);
                assert.equal(result.status, 200);
                assert.equal(result.headers['content-type'], 'text/html; charset=utf-8');
                assert.match(result.body, new RegExp(`<h1>${locale} body</h1>`));
            }
            assert.equal(app.rendered.length, 3);
            assert.equal(app.rendered[0].target.name, 'publication.html');
            assert.equal(app.rendered[0].data.markdownAlternateUrl, 'https://example.test/en/journal/2026/hello.md');
            assert.equal(app.rendered[1].data.markdownAlternateUrl, undefined);
            assert.deepEqual(Object.keys(app.rendered[0].data.alternateUrls), locales);
            const raw = await app.send('/en/journal/2026/hello.md');
            assert.equal(raw.status, 200);
            assert.equal(raw.headers['content-type'], 'text/markdown; charset=utf-8');
            assert.match(raw.body, /^---\ntitle: en title/);
            assert.equal(app.rendered.length, 3);
            assert.equal((await app.send('/de/journal/2026/hello.md')).status, 404);
            assert.equal((await app.send('/ru/journal/2026/hello.md')).status, 404);
            assert.equal((await app.send('/journal/2026/hello.md')).status, 404);
            assert.equal((await app.send('/en/journal/2026/hello%2emd')).status, 404);
            assert.equal((await app.send('/en/journal/2026/hello.md/')).status, 404);
            assert.equal((await app.send('/de//journal/2026/hello.md')).status, 404);
            assert.equal((await app.send('/de/journal/./2026/hello.md')).status, 404);
            assert.deepEqual(app.calls, []);
            await app.send('/de/about');
            assert.deepEqual(app.calls, ['template', 'static']);
        } finally {
            await fs.rm(app.root, {recursive: true, force: true});
        }
    });

    it('rejects malformed publications and traversal without disclosing source content', async () => {
        const app = await fixture();
        const secret = await fs.mkdtemp(path.join(os.tmpdir(), 'teq-cms-secret-'));
        try {
            await app.write('en', 'journal/broken', '---\ntitle: No date\ndescription: Missing date\n---\nSecret body\n');
            assert.equal((await app.send('/en/journal/broken.md')).status, 404);
            assert.equal((await app.send('/en/journal/%2e%2e/hidden.md')).status, 404);
            assert.equal((await app.send('/en/journal/%ZZ.md')).status, 404);
            await fs.writeFile(path.join(secret, 'outside.md'), '---\ntitle: Outside\ndescription: Outside\ndate: 2026-09-23\n---\nSECRET\n');
            await fs.symlink(path.join(secret, 'outside.md'), path.join(app.root, 'tmpl', 'web', 'en', 'journal', 'outside.md'));
            assert.equal((await app.send('/en/journal/outside.md')).status, 404);
            await app.write('en', 'private/inside', '---\ntitle: Inside\ndescription: Private\ndate: 2026-09-23\n---\nPRIVATE\n');
            await fs.symlink(path.join(app.root, 'tmpl', 'web', 'en', 'private', 'inside.md'),
                path.join(app.root, 'tmpl', 'web', 'en', 'journal', 'inside.md'));
            assert.equal((await app.send('/en/journal/inside.md')).status, 404);
            await assert.rejects(app.source.read({locale: 'en', route: '../outside'}));
        } finally {
            await fs.rm(app.root, {recursive: true, force: true});
            await fs.rm(secret, {recursive: true, force: true});
        }
    });
});
