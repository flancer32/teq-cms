import ErrorPolicy from '../../src/Back/Web/Error/Policy.mjs';
import ErrorRespond from '../../src/Back/Web/Error/Respond.mjs';
import NotFound from '../../src/Back/Web/Handler/NotFound.mjs';
import Web from '../../src/Back/Helper/Web.mjs';
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http2 from 'node:http2';
import {parseDocument} from 'yaml';
import {marked} from 'marked';
import * as mustache from 'mustache';
import Mustache from '../../node_modules/@flancer32/teq-tmpl/src/Back/Service/Engine/Mustache.js';
import Find from '../../node_modules/@flancer32/teq-tmpl/src/Back/Act/File/Find.js';
import FileLoad from '../../node_modules/@flancer32/teq-tmpl/src/Back/Act/File/Load.js';
import Locale from '../../node_modules/@flancer32/teq-tmpl/src/Back/Helper/Locale.js';
import Load from '../../node_modules/@flancer32/teq-tmpl/src/Back/Service/Load.js';
import Render from '../../node_modules/@flancer32/teq-tmpl/src/Back/Service/Render.js';
import Policy from '../../src/Back/Publication/Policy.mjs';
import Representation from '../../src/Back/Publication/Representation.mjs';
import Routing from '../../src/Back/Publication/Routing.mjs';
import StaticRoute from '../../src/Back/Web/Handler/StaticRoute.mjs';
import Source from '../../src/Back/Publication/Source.mjs';
import Catalog from '../../src/Back/Publication/Catalog.mjs';
import Generator from '../../src/Back/Discovery/Generator.mjs';
import Handler from '../../src/Back/Publication/Handler.mjs';
import Plugin from '../../src/Back/Cli/Plugin.mjs';
import Pipeline from '../../node_modules/@teqfw/web/src/Back/PipelineEngine.mjs';
import Kahn from '../../node_modules/@teqfw/web/src/Back/Helper/Order/Kahn.mjs';
import Respond from '../../node_modules/@teqfw/web/src/Back/Helper/Respond.mjs';

const locales = ['en', 'de', 'ru'];
const family = {prefix: 'journal', presentation: 'publication.html'};
const presentation = '<link rel="canonical" href="{{{canonicalUrl}}}"><article>{{{publication.html}}}</article>';
const logger = {forSource: () => ({error() {}, info() {}, warn() {}, trace() {}})};
const info = {create: value => value};
const STAGE = {INIT: 'INIT', PROCESS: 'PROCESS', FINALIZE: 'FINALIZE'};

function response() {
    return {
        status: undefined, headers: {}, body: '', headersSent: false, writableEnded: false,
        writeHead(status, headers = {}) { this.status = status; this.headers = headers; this.headersSent = true; },
        end(body = '') { this.body = body; this.writableEnded = true; },
    };
}

async function fixture({presentationLocale = 'de', defaultLocale} = {defaultLocale: 'de'}) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'teq-cms-publication-'));
    const tmplConfig = {
        getRootPath: () => root,
        getAvailableLocales: () => locales,
        getDefaultLocale: () => defaultLocale,
    };
    const config = {
        getPublicationFamilies: () => [family],
        getAgentMessageEnabled: () => false,
        getBaseUrl: () => 'https://example.test',
    };
    const policy = new Policy({config});
    const routing = new Routing({policy, config, tmplConfig});
    const source = new Source({fs, path, tmplConfig, config, routing, policy, parseDocument, marked});
    const actFind = new Find({fs: fsSync, path, config: tmplConfig, log: logger, helpLocale: new Locale()});
    const actLoad = new FileLoad({fsPromises: fs, log: logger});
    const load = new Load({log: logger, actFind, actLoad});
    const dtoTarget = {create: value => value};
    const catalog = new Catalog({fs, path, tmplConfig, config, routing, source, dtoTarget, load});
    const presentationFile = path.join(root, 'tmpl/web', presentationLocale, family.presentation);
    await fs.mkdir(path.dirname(presentationFile), {recursive: true});
    await fs.writeFile(presentationFile, presentation);
    const render = new Render({log: logger, actFind, actLoad, engine: new Mustache({mustache, log: logger})});
    const generator = new Generator({config, routing, catalog, tmplConfig, fs, path});
    const respond = new Respond({http2});
    const errors = new ErrorRespond({policy: new ErrorPolicy(), routing, representation: new Representation(), tmplConfig, render, respond, logger});
    const handNotFound = new NotFound({errors, dtoInfo: info, STAGE});
    const rendered = [];
    const handler = new Handler({
        config, routing, helpWeb: new Web({http2, tmplConfig}), representation: new Representation(), tmplConfig, source, catalog, respond, errors, dtoInfo: info, STAGE, logger, path,
        render: {perform: async value => {
            rendered.push(value);
            return render.perform(value);
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
    const plugin = new Plugin({handNotFound,
        pipeline, handLog: {getRegistrationInfo: () => ({name: 'log', stage: STAGE.INIT}), handle: async () => {}},
        handStatic: staticHandler, handStaticRoute: new StaticRoute({routing, handStatic: staticHandler, respond, errors, dtoInfo: info, STAGE, path}), handTmpl: templateHandler, handPublication: handler,
        handAgentMessage: {},
        dtoSource: {create: value => value}, tmplConfig, config, path,
    });
    await plugin.onStartup();
    pipeline.lockHandlers();
    const send = async (url, headers = {}) => {
        const res = response();
        await pipeline.onEventRequest({url, headers}, res);
        return res;
    };
    const write = async (locale, route, text) => {
        const file = path.join(root, 'tmpl', 'web', locale, `${route}.md`);
        await fs.mkdir(path.dirname(file), {recursive: true});
        await fs.writeFile(file, text);
    };
    return {root, source, catalog, generator, rendered, calls, send, write};
}

describe('Markdown publication through the CMS plugin and web pipeline', () => {
    it('serves exact localized HTML and neutral English Markdown with a German default', async () => {
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
            assert.equal(app.rendered[0].data.markdownAlternateUrl, 'https://example.test/journal/2026/hello.md');
            assert.equal(app.rendered[1].data.markdownAlternateUrl, 'https://example.test/journal/2026/hello.md');
            for (const [index, locale] of locales.entries()) {
                assert.equal(app.rendered[index].data.canonicalUrl, `https://example.test/${locale}/journal/2026/hello`);
                assert.equal(app.rendered[index].data.publication.locale, locale);
            }
            assert.deepEqual(Object.keys(app.rendered[0].data.alternateUrls), locales);
            const raw = await app.send('/journal/2026/hello', {accept: 'text/markdown'});
            assert.equal(raw.status, 200);
            assert.equal(raw.headers['content-type'], 'text/markdown; charset=utf-8');
            assert.equal(raw.body, '---\ntitle: en title\ndescription: en description\ndate: 2026-09-23\n---\n# en body\n');
            assert.equal((await app.send('/en/journal/2026/hello.md')).body, raw.body);
            assert.equal(app.rendered.length, 3);
            for (const userAgent of ['ExampleBot/1.0', 'ExampleAgent/1.0']) {
                const result = await app.send('/journal/2026/hello', {'user-agent': userAgent});
                assert.equal(result.body, raw.body);
                assert.equal(result.headers['content-type'], raw.headers['content-type']);
            }
            const human = await app.send('/journal/2026/hello', {'user-agent': 'Mozilla/5.0'});
            assert.equal(human.headers['content-type'], 'text/html; charset=utf-8');
            assert.equal(human.headers.vary, 'Accept, User-Agent, Accept-Language');
            assert.match(app.rendered.at(-1).data.publication.source, /de body/);
            for (const url of ['/journal/2026/hello', '/journal/2026/hello.html']) {
                const res = await app.send(url, {accept: 'text/html', 'accept-language': 'ru-RU,en;q=0.5'});
                assert.equal(res.status, 200);
                assert.equal(app.rendered.at(-1).data.locale, 'ru');
                assert.equal(app.rendered.at(-1).data.canonicalUrl, 'https://example.test/ru/journal/2026/hello');
            }
            assert.equal((await app.send('/ru/journal/2026/hello', {'user-agent': 'ExampleBot'})).body,
                '---\ntitle: ru title\ndescription: ru description\ndate: 2026-09-23\n---\n# ru body\n');
            assert.equal((await app.send('/de/journal/2026/hello.md')).status, 200);
            assert.equal((await app.send('/ru/journal/2026/hello.md')).status, 200);
            assert.equal((await app.send('/journal/2026/hello.md')).body, raw.body);
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

    it('serves the six URL forms from logical sources with stable canonical links and discovery', async () => {
        const app = await fixture();
        try {
            const route = 'journal/nested/page';
            const text = locale => `---\ntitle: ${locale}\ndescription: Test\ndate: 2026-09-30\n---\n# ${locale} source\n`;
            for (const locale of locales) await app.write(locale, route, text(locale));
            const before = await app.generator.build();
            for (const suffix of ['', '.md']) {
                const result = await app.send(`/${route}${suffix}?tracking=1`, {accept: 'text/markdown'});
                assert.equal(result.status, 200);
                assert.equal(result.headers['content-type'], 'text/markdown; charset=utf-8');
                assert.equal(result.body, text('en'));
            }
            for (const locale of locales) {
                const markdown = await app.send(`/${locale}/${route}.md`);
                assert.equal(markdown.status, 200);
                assert.equal(markdown.headers['content-type'], 'text/markdown; charset=utf-8');
                assert.equal(markdown.body, text(locale));
                for (const suffix of ['', '.html']) {
                    const result = await app.send(`/${locale}/${route}${suffix}`);
                    assert.equal(result.status, 200);
                    assert.equal(result.headers['content-type'], 'text/html; charset=utf-8');
                    const input = app.rendered.at(-1);
                    assert.equal(input.template, presentation);
                    assert.equal(input.target.name, family.presentation);
                    assert.equal(input.data.publication.source, markdown.body);
                    assert.equal(input.data.publication.route, route);
                    assert.equal(input.data.locale, locale);
                    assert.equal(input.data.canonicalUrl, `https://example.test/${locale}/${route}`);
                    assert.match(result.body, new RegExp(`<h1>${locale} source</h1>`));
                    assert.ok(result.body.includes(`<link rel="canonical" href="${input.data.canonicalUrl}">`));
                    assert.deepEqual(input.data.alternateUrls, Object.fromEntries(locales.map(value => [value, `https://example.test/${value}/${route}`])));
                    assert.equal(input.data.markdownAlternateUrl, `https://example.test/${route}.md`);
                }
            }
            const neutralHtml = await app.send(`/${route}.html`);
            assert.equal(neutralHtml.status, 200);
            assert.equal(neutralHtml.headers['content-type'], 'text/html; charset=utf-8');
            assert.match(neutralHtml.body, /<h1>de source<\/h1>/);
            assert.equal(app.rendered.at(-1).data.publication.source, text('de'));
            assert.equal(app.rendered.at(-1).data.canonicalUrl, `https://example.test/de/${route}`);
            assert.deepEqual(await app.generator.build(), before);
            assert.deepEqual(before.llms.split('\n').filter(line => line.startsWith('- ')), [`- https://example.test/${route}.md`]);
            assert.deepEqual([...before.sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]),
                ['de', 'en', 'ru'].map(locale => `https://example.test/${locale}/${route}`));
            assert.deepEqual(app.calls, []);
        } finally {
            await fs.rm(app.root, {recursive: true, force: true});
        }
    });

    it('requires a maintained default locale for neutral HTML without changing neutral Markdown', async () => {
        for (const defaultLocale of [undefined, 'xx']) {
            const app = await fixture({defaultLocale, presentationLocale: 'en'});
            try {
                await app.write('en', 'journal/page', '---\ntitle: English\ndescription: Test\ndate: 2026-09-30\n---\nEnglish body\n');
                assert.equal((await app.send('/journal/page.html')).status, 404);
                assert.equal((await app.send('/journal/page.md')).status, 200);
                assert.equal((await app.send('/en/journal/page.html')).status, 200);
            } finally {
                await fs.rm(app.root, {recursive: true, force: true});
            }
        }
    });

    it('shares neutral availability with discovery and never substitutes localized content', async () => {
        const app = await fixture();
        try {
            const text = locale => `---\ntitle: ${locale}\ndescription: Description\ndate: 2026-09-30\n---\n${locale} source\n`;
            await app.write('de', 'journal/default-only', text('de'));
            await app.write('ru', 'journal/other-only', text('ru'));
            await app.write('en', 'journal/shared', text('en'));
            await app.write('de', 'journal/shared', text('de'));
            assert.equal((await app.send('/journal/default-only', {accept: 'text/markdown'})).body, text('de'));
            assert.equal((await app.send('/journal/shared', {accept: 'text/markdown'})).body, text('en'));
            assert.equal((await app.send('/journal/other-only', {accept: 'text/markdown'})).status, 404);
            for (const suffix of ['', '.md', '.html']) assert.equal((await app.send(`/journal/missing${suffix}`)).status, 404);
            assert.equal((await app.send('/journal/other-only.md')).status, 404);
            assert.equal((await app.send('/journal/other-only.html')).status, 404);
            await app.write('en', 'journal/english-only', text('en'));
            assert.equal((await app.send('/journal/english-only.html')).status, 404);
            assert.equal((await app.send('/journal/english-only.md')).body, text('en'));
            await fs.rm(path.join(app.root, 'tmpl/web/en/journal/english-only.md'));
            for (const url of ['/en/journal/default-only', '/de/journal/other-only', '/ru/journal/shared']) {
                for (const suffix of ['', '.md', '.html']) assert.equal((await app.send(`${url}${suffix}`)).status, 404);
            }
            assert.equal((await app.send('/de/journal/default-only')).status, 200);
            assert.deepEqual(app.rendered.at(-1).data.alternateUrls, {
                de: 'https://example.test/de/journal/default-only',
            });
            assert.equal(app.rendered.at(-1).data.markdownAlternateUrl, 'https://example.test/journal/default-only.md');
            assert.equal((await app.send('/ru/journal/other-only')).status, 200);
            assert.deepEqual(app.rendered.at(-1).data.alternateUrls, {
                ru: 'https://example.test/ru/journal/other-only',
            });
            assert.equal(app.rendered.at(-1).data.markdownAlternateUrl, undefined);
            const files = await app.generator.build();
            const markdownUrls = files.llms.split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(2));
            assert.deepEqual(markdownUrls, [
                'https://example.test/journal/default-only.md', 'https://example.test/journal/shared.md',
            ]);
            for (const url of markdownUrls) assert.equal((await app.send(new URL(url).pathname)).status, 200);
            assert.deepEqual([...files.sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), [
                'https://example.test/de/journal/default-only', 'https://example.test/de/journal/shared',
                'https://example.test/en/journal/shared', 'https://example.test/ru/journal/other-only',
            ]);
            assert.doesNotMatch(files.llms, /other-only|Machine/);
            assert.deepEqual(app.calls, []);
        } finally {
            await fs.rm(app.root, {recursive: true, force: true});
        }
    });

    it('uses real tmpl lookup to exclude missing and empty presentations and supports default fallback', async () => {
        const app = await fixture({presentationLocale: 'en', defaultLocale: 'de'});
        try {
            for (const locale of locales) {
                await app.write(locale, 'journal/presentation', `---\ntitle: ${locale}\ndescription: Test\ndate: 2026-09-30\n---\n# ${locale} body\n`);
            }
            const defaultTemplate = path.join(app.root, 'tmpl/web/de/publication.html');
            const checkUnavailable = async () => {
                assert.equal((await app.send('/en/journal/presentation')).status, 200);
                assert.deepEqual(app.rendered.at(-1).data.alternateUrls, {en: 'https://example.test/en/journal/presentation'});
                for (const locale of ['de', 'ru']) {
                    for (const suffix of ['', '.html']) assert.equal((await app.send(`/${locale}/journal/presentation${suffix}`)).status, 404);
                    assert.equal((await app.send(`/${locale}/journal/presentation.md`)).status, 200);
                }
                assert.equal((await app.send('/journal/presentation.html')).status, 404);
                assert.equal((await app.send('/journal/presentation.md')).status, 200);
                const files = await app.generator.build();
                assert.deepEqual([...files.sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), ['https://example.test/en/journal/presentation']);
                assert.match(files.llms, /- https:\/\/example.test\/journal\/presentation\.md/);
                assert.equal((await app.send('/journal/presentation', {accept: 'text/markdown'})).status, 200);
            };
            await checkUnavailable();
            await fs.writeFile(defaultTemplate, '   \n');
            await checkUnavailable();
            await fs.writeFile(defaultTemplate, presentation);
            const result = await app.send('/ru/journal/presentation');
            assert.equal(result.status, 200);
            assert.match(result.body, /<h1>ru body<\/h1>/);
            assert.deepEqual(Object.keys(app.rendered.at(-1).data.alternateUrls), locales);
            const files = await app.generator.build();
            assert.equal([...files.sitemap.matchAll(/<loc>/g)].length, 3);
            assert.deepEqual(app.calls, []);
        } finally {
            await fs.rm(app.root, {recursive: true, force: true});
        }
    });

    it('excludes invalid variants from representations and links while preserving valid locales', async () => {
        const app = await fixture();
        try {
            const valid = '---\ntitle: German\ndescription: Valid\ndate: 2026-09-30\n---\nGerman source\n';
            await app.write('en', 'journal/partial', 'Invalid front matter');
            await app.write('de', 'journal/partial', valid);
            await app.write('ru', 'journal/partial', '---\ntitle: Broken\n---\nPrivate body');
            assert.equal((await app.send('/journal/partial', {accept: 'text/markdown'})).body, valid);
            assert.equal((await app.send('/en/journal/partial')).status, 404);
            assert.equal((await app.send('/de/journal/partial')).status, 200);
            assert.deepEqual(app.rendered.at(-1).data.alternateUrls, {de: 'https://example.test/de/journal/partial'});
            const files = await app.generator.build();
            assert.deepEqual(files.llms.split('\n').filter(line => line.startsWith('- ')), ['- https://example.test/journal/partial.md']);
            assert.deepEqual([...files.sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), ['https://example.test/de/journal/partial']);
            await assert.rejects(app.source.read({locale: 'en', route: 'journal/partial'}), /front matter/);
        } finally {
            await fs.rm(app.root, {recursive: true, force: true});
        }
    });

    it('rejects malformed publications and traversal without disclosing source content', async () => {
        const app = await fixture();
        const secret = await fs.mkdtemp(path.join(os.tmpdir(), 'teq-cms-secret-'));
        try {
            await app.write('en', 'journal/broken', '---\ntitle: No date\ndescription: Missing date\n---\nSecret body\n');
            for (const prefix of ['', '/en']) {
                for (const suffix of ['', '.md', '.html']) assert.equal((await app.send(`${prefix}/journal/broken${suffix}`)).status, 404);
            }
            for (const url of ['/xx/journal/broken.md', '/xx/journal/broken.html', '/en/journal/../private/inside.html', '/en/journal//broken.html', '/en/journal/broken.html/', '/en/journal/broken.md.html', '/journal/broken.html.md', '/journal/broken.txt', '/journal/.md', '/journal/.html', '/en/journal/./broken.md', '/journal/broken%2ehtml']) {
                assert.equal((await app.send(url)).status, 404);
            }
            assert.equal((await app.send('/en/journal/%2e%2e/hidden')).status, 404);
            assert.equal((await app.send('/journal/%ZZ', {accept: 'text/markdown'})).status, 404);
            await fs.writeFile(path.join(secret, 'outside.md'), '---\ntitle: Outside\ndescription: Outside\ndate: 2026-09-23\n---\nSECRET\n');
            await fs.symlink(path.join(secret, 'outside.md'), path.join(app.root, 'tmpl', 'web', 'en', 'journal', 'outside.md'));
            for (const prefix of ['', '/en']) {
                for (const suffix of ['', '.md', '.html']) assert.equal((await app.send(`${prefix}/journal/outside${suffix}`)).status, 404);
            }
            await app.write('en', 'private/inside', '---\ntitle: Inside\ndescription: Private\ndate: 2026-09-23\n---\nPRIVATE\n');
            await fs.symlink(path.join(app.root, 'tmpl', 'web', 'en', 'private', 'inside.md'),
                path.join(app.root, 'tmpl', 'web', 'en', 'journal', 'inside.md'));
            for (const suffix of ['', '.md', '.html']) assert.equal((await app.send(`/en/journal/inside${suffix}`)).status, 404);
            await assert.rejects(app.source.read({locale: 'en', route: '../outside'}));
        } finally {
            await fs.rm(app.root, {recursive: true, force: true});
            await fs.rm(secret, {recursive: true, force: true});
        }
    });
});
