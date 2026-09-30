import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http2 from 'node:http2';
import {Writable} from 'node:stream';
import {once} from 'node:events';
import {parseDocument} from 'yaml';
import {marked} from 'marked';
import * as mustache from 'mustache';
import Policy from '../../src/Back/Publication/Policy.mjs';
import Representation from '../../src/Back/Publication/Representation.mjs';
import Routing from '../../src/Back/Publication/Routing.mjs';
import Source from '../../src/Back/Publication/Source.mjs';
import Catalog from '../../src/Back/Publication/Catalog.mjs';
import Publication from '../../src/Back/Publication/Handler.mjs';
import Generator from '../../src/Back/Discovery/Generator.mjs';
import StaticRoute from '../../src/Back/Web/Handler/StaticRoute.mjs';
import Template from '../../src/Back/Web/Handler/Template.mjs';
import AgentMessage from '../../src/Back/Web/Handler/AgentMessage.mjs';
import Adapter from '../../src/Back/Di/Replace/Adapter.mjs';
import File from '../../src/Back/Helper/File.mjs';
import Web from '../../src/Back/Helper/Web.mjs';
import Plugin from '../../src/Back/Cli/Plugin.mjs';
import Find from '../../node_modules/@flancer32/teq-tmpl/src/Back/Act/File/Find.js';
import FileLoad from '../../node_modules/@flancer32/teq-tmpl/src/Back/Act/File/Load.js';
import Locale from '../../node_modules/@flancer32/teq-tmpl/src/Back/Helper/Locale.js';
import Load from '../../node_modules/@flancer32/teq-tmpl/src/Back/Service/Load.js';
import Render from '../../node_modules/@flancer32/teq-tmpl/src/Back/Service/Render.js';
import Mustache from '../../node_modules/@flancer32/teq-tmpl/src/Back/Service/Engine/Mustache.js';
import Pipeline from '../../node_modules/@teqfw/web/src/Back/PipelineEngine.mjs';
import Kahn from '../../node_modules/@teqfw/web/src/Back/Helper/Order/Kahn.mjs';
import Respond from '../../node_modules/@teqfw/web/src/Back/Helper/Respond.mjs';
import Static from '../../node_modules/@teqfw/web/src/Back/Handler/Static.mjs';
import Registry from '../../node_modules/@teqfw/web/src/Back/Handler/Static/A/Registry.mjs';
import StaticConfig from '../../node_modules/@teqfw/web/src/Back/Handler/Static/A/Config.mjs';
import FileService from '../../node_modules/@teqfw/web/src/Back/Handler/Static/A/FileService.mjs';
import Resolver from '../../node_modules/@teqfw/web/src/Back/Handler/Static/A/Resolver.mjs';
import Fallback from '../../node_modules/@teqfw/web/src/Back/Handler/Static/A/Fallback.mjs';
import Mime from '../../node_modules/@teqfw/web/src/Back/Helper/Mime.mjs';

const text = label => `---\ntitle: ${label}\ndescription: Test\ndate: 2026-09-30\n---\n# ${label}\n`;
const presentation = '<main>{{{publication.html}}}</main><link rel="canonical" href="{{{canonicalUrl}}}">';
const logger = {forSource: () => ({error() {}, warn() {}, info() {}, trace() {}})};
const STAGE = {INIT: 'INIT', PROCESS: 'PROCESS', FINALIZE: 'FINALIZE'};
const dtoInfo = {create: value => value};

class Response extends Writable {
    status;
    headers = {};
    headersSent = false;
    chunks = [];
    writeHead(status, headers = {}) { this.status = status; this.headers = headers; this.headersSent = true; }
    _write(chunk, encoding, callback) { this.chunks.push(Buffer.from(chunk)); callback(); }
    get body() { return Buffer.concat(this.chunks).toString(); }
}

async function fixture(options = {}) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-site-'));
    const locales = options.locales ?? ['en', 'de', 'ru'];
    const defaultLocale = 'defaultLocale' in options ? options.defaultLocale : 'de';
    const tmplConfig = {getRootPath: () => root, getAvailableLocales: () => locales, getDefaultLocale: () => defaultLocale};
    const config = {getPublicationFamilies: () => [], getBaseUrl: () => 'https://example.test',
        getAgentMessageEnabled: () => true, getAgentMessageToken: () => undefined};
    // Host policy changes presentation by route, without configuration keys or a custom handler.
    const policy = new Policy({config});
    policy.getPresentationName = ({route}) => route.startsWith('docs/') ? 'documentation.html' : 'publication.html';
    const routing = new Routing({config, policy, tmplConfig});
    const source = new Source({config, policy, routing, tmplConfig, fs, path, parseDocument, marked});
    const actFind = new Find({fs: fsSync, path, config: tmplConfig, log: logger, helpLocale: new Locale()});
    const actLoad = new FileLoad({fsPromises: fs, log: logger});
    const load = new Load({log: logger, actFind, actLoad});
    const render = new Render({log: logger, actFind, actLoad, engine: new Mustache({mustache, log: logger})});
    const dtoTarget = {create: value => value};
    const catalog = new Catalog({config, routing, tmplConfig, source, fs, path, dtoTarget, load});
    const respond = new Respond({http2});
    const rendered = [];
    const handPublication = new Publication({config, routing, helpWeb: new Web({http2, tmplConfig}), representation: new Representation(), tmplConfig, source, catalog, respond, dtoInfo, STAGE, logger, path,
        render: {perform: async params => { rendered.push(params); return render.perform(params); }}});
    const handStatic = new Static({registry: new Registry({configFactory: new StaticConfig({path}), logger}),
        fileService: new FileService({fs: fsSync, http2, path, logger, helpMime: new Mime(), resolver: new Resolver({path}), fallback: new Fallback({fs: fsSync, path})}),
        respond, dtoInfoFactory: dtoInfo, STAGE});
    const adapter = new Adapter({path, logger, tmplConfig, config, dtoTmplTarget: dtoTarget,
        helpWeb: new Web({http2, tmplConfig}), helpFile: new File({fs: fsSync, path})});
    const templateCalls = [];
    const handTmpl = new Template({http2, logger, respond, dtoInfo, servTmplLoad: load, servTmplRender: render,
        adapter: {getRenderData: params => { templateCalls.push(params.req.url); return adapter.getRenderData(params); }}, tmplConfig, STAGE});
    const accepted = [];
    const handAgentMessage = new AgentMessage({config, inbox: {accept: async record => accepted.push(record)}, dtoInfo, STAGE, logger});
    const pipeline = new Pipeline({dtoRequestContextFactory: {create: () => ({})}, logger, respond, helpOrder: new Kahn(), STAGE});
    const plugin = new Plugin({pipeline, config, tmplConfig, path, dtoSource: {create: value => value}, handStatic, handTmpl, handPublication,
        handStaticRoute: new StaticRoute({routing, handStatic, respond, dtoInfo, STAGE, path}), handAgentMessage,
        handLog: {getRegistrationInfo: () => ({name: 'log', stage: STAGE.INIT}), handle: async () => {}}});
    await plugin.onStartup();
    pipeline.lockHandlers();
    const write = async (file, content) => { const target = path.join(root, file); await fs.mkdir(path.dirname(target), {recursive: true}); await fs.writeFile(target, content); };
    await write('tmpl/web/de/publication.html', presentation);
    await write('tmpl/web/de/documentation.html', '<section>{{{publication.html}}}</section>');
    const send = async (url, headers = {}) => {
        const res = new Response();
        await pipeline.onEventRequest({url, method: 'GET', headers}, res);
        if (!res.writableFinished) await once(res, 'finish');
        return res;
    };
    return {root, source, catalog, routing, config, rendered, templateCalls, accepted, write, send,
        generator: new Generator({config, routing, catalog, tmplConfig, fs, path})};
}

it('publishes top-level and nested Markdown with the same corpus and canonical links as discovery', async () => {
    const app = await fixture();
    try {
        await app.write('tmpl/web/about.md', text('Neutral'));
        for (const locale of ['en', 'de']) {
            await app.write(`tmpl/web/${locale}/about.md`, text(locale));
            await app.write(`tmpl/web/${locale}/docs/nested/page.md`, text(`docs-${locale}`));
        }
        await app.write('tmpl/web/de/about.html', 'OLD HTML');
        await app.write('web/about.html', 'OLD STATIC');
        for (const suffix of ['', '.md']) {
            const res = await app.send(`/about${suffix}`, {accept: 'text/markdown'});
            assert.equal(res.status, 200);
            assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8');
            assert.equal(res.body, text('Neutral'));
        }
        for (const locale of ['en', 'de']) {
            const md = await app.send(`/${locale}/about.md`);
            assert.equal(md.body, text(locale));
            for (const suffix of ['', '.html']) {
                const res = await app.send(`/${locale}/about${suffix}`);
                assert.equal(res.status, 200);
                assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
                assert.match(res.body, new RegExp(`<main><h1>${locale}</h1>`));
                const data = app.rendered.at(-1).data;
                assert.equal(data.publication.source, md.body);
                assert.equal(data.canonicalUrl, `https://example.test/${locale}/about`);
                assert.deepEqual(data.alternateUrls, {en: 'https://example.test/en/about', de: 'https://example.test/de/about'});
                assert.equal(data.markdownAlternateUrl, 'https://example.test/about.md');
            }
        }
        assert.match((await app.send('/about.html')).body, /<h1>Neutral<\/h1>/);
        assert.match((await app.send('/en/docs/nested/page.html')).body, /<section><h1>docs-en<\/h1>/);
        assert.equal(app.rendered.at(-1).target.name, 'documentation.html');
        assert.equal((await app.send('/ru/about.html')).status, 404);
        assert.equal((await app.send('/ru/about.md')).status, 404);
        assert.deepEqual(app.templateCalls, []);
        const files = await app.generator.build();
        assert.deepEqual(files.llms.split('\n').filter(line => line.startsWith('- ')), ['- https://example.test/about.md', '- https://example.test/docs/nested/page.md']);
        assert.deepEqual([...files.sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]),
            ['about', 'de/about', 'de/docs/nested/page', 'en/about', 'en/docs/nested/page'].map(p => `https://example.test/${p}`));
        for (const match of files.sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) assert.equal((await app.send(new URL(match[1]).pathname)).status, 200);
        for (const item of await app.catalog.list({locale: ''})) assert.equal((await app.send(app.routing.getUrl(item))).status, 200);
    } finally { await fs.rm(app.root, {recursive: true, force: true}); }
});

it('uses Markdown, then HTML templates, then web static files for root and ordinary pages', async () => {
    const app = await fixture();
    try {
        await app.write('web/index.html', 'STATIC HOME');
        assert.equal((await app.send('/')).body, 'STATIC HOME');
        await app.write('tmpl/web/index.html', 'TEMPLATE HOME');
        assert.equal((await app.send('/')).status, 302);
        assert.equal((await app.send('/de/')).body, 'TEMPLATE HOME');
        await app.write('tmpl/web/index.md', text('ROOT MARKDOWN'));
        for (const url of ['/', '/index', '/index.md']) assert.equal((await app.send(url, {accept: 'text/markdown'})).body, text('ROOT MARKDOWN'));
        await app.write('tmpl/web/en/index.md', text('English home'));
        for (const url of ['/en', '/en/', '/en/index', '/en/index.html']) {
            assert.equal((await app.send(url)).status, 200);
            assert.equal(app.rendered.at(-1).data.canonicalUrl, 'https://example.test/en/');
            assert.equal(app.rendered.at(-1).data.markdownAlternateUrl, 'https://example.test/index.md');
        }
        assert.equal((await app.send('/en/index.md')).body, text('English home'));
        await app.write('tmpl/web/de/index.md', text('German home'));
        assert.match((await app.send('/index.html')).body, /ROOT MARKDOWN/);
        assert.equal(app.rendered.at(-1).data.canonicalUrl, 'https://example.test/');
        const files = await app.generator.build();
        assert.deepEqual(files.llms.split('\n').filter(line => line.startsWith('- ')), ['- https://example.test/index.md']);
        assert.match(files.sitemap, /<loc>https:\/\/example.test\/en\/<\/loc>/);
        assert.doesNotMatch(files.sitemap, /index|\.html/);
        await app.write('tmpl/web/index.md', 'BROKEN MARKDOWN');
        assert.equal((await app.send('/')).status, 404);
        await app.write('tmpl/web/de/old.html', 'OLD TEMPLATE');
        await app.write('web/old.html', 'OLD STATIC');
        assert.equal((await app.send('/de/old.html')).body, 'OLD TEMPLATE');
        await app.write('tmpl/web/de/old.md', text('Markdown first'));
        assert.match((await app.send('/de/old.html')).body, /Markdown first/);
        await app.write('tmpl/web/de/old.md', 'INVALID');
        assert.equal((await app.send('/de/old.html')).status, 404);
        assert.equal((await app.send('/old')).status, 404);
        await app.write('web/plain.txt', 'STATIC TEXT');
        assert.equal((await app.send('/plain.txt')).body, 'STATIC TEXT');
        assert.equal((await app.send('/missing')).status, 404);
    } finally { await fs.rm(app.root, {recursive: true, force: true}); }
});

it('bypasses templates for static prefixes and discovery files while preserving the agent endpoint', async () => {
    const app = await fixture();
    try {
        await app.write('web/assets/a.html', 'STATIC ASSET');
        await app.write('tmpl/web/assets/a.md', text('Must not publish'));
        await app.write('tmpl/web/de/assets/a.html', 'Must not template');
        assert.equal((await app.send('/assets/a.html')).body, 'STATIC ASSET');
        await app.write('tmpl/web/de/assets/missing.html', 'Must not fall back');
        assert.equal((await app.send('/assets/missing.html')).status, 404);
        await app.write('tmpl/web/assets-other/a.md', text('PUBLIC'));
        assert.equal((await app.send('/assets-other/a', {accept: 'text/markdown'})).body, text('PUBLIC'));
        for (const file of ['robots.txt', 'llms.txt', 'sitemap.xml']) {
            await app.write(`web/${file}`, `STATIC ${file}`);
            await app.write(`tmpl/web/de/${file}`, 'Must not template');
            assert.equal((await app.send(`/${file}`)).body, `STATIC ${file}`);
        }
        const res = await app.send('/agent/message', {'x-agent-id': 'agent', 'x-agent-message': 'Hello'});
        assert.equal(res.status, 202);
        assert.deepEqual(app.accepted, [{agent: 'agent', message: 'Hello'}]);
        assert.equal((await app.send('/agent/%6dessage')).status, 404);
        assert.deepEqual(app.templateCalls, []);
        assert.equal(await app.source.readNeutral({route: 'assets/a'}), null);
        const files = await app.generator.build();
        assert.doesNotMatch(files.llms, /\/assets\/|agent\/message/);
        for (const url of ['/assets/../plain.txt', '/assets//a.html', '/%61ssets/a.html', '/assets/%2e%2e/plain.txt']) {
            assert.equal((await app.send(url)).status, 404);
        }
    } finally { await fs.rm(app.root, {recursive: true, force: true}); }
});

it('blocks invalid sources, presentation failures and unsafe paths without exposing sidecars', async () => {
    const app = await fixture();
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-outside-'));
    try {
        await app.write('tmpl/web/about.md', 'INVALID PRIMARY');
        await app.write('tmpl/web/en/about.md', text('English fallback must not hide corruption'));
        assert.equal((await app.send('/about.md')).status, 404);
        await fs.rm(path.join(app.root, 'tmpl/web/about.md'));
        assert.equal((await app.send('/about.md')).body, text('English fallback must not hide corruption'));
        await app.write('tmpl/web/de/publication.html', '  ');
        assert.equal((await app.send('/en/about.html')).status, 404);
        assert.equal((await app.send('/en/about.md')).status, 200);
        assert.doesNotMatch((await app.generator.build()).sitemap, /about/);
        await app.write('tmpl/web/about.prompt.md', text('SIDECAR'));
        await app.write('tmpl/web/AGENTS.md', 'Instructions, not front matter');
        await app.write('tmpl/web/unrelated.txt', 'Unrelated');
        await fs.writeFile(path.join(outside, 'secret.md'), text('SECRET'));
        await fs.symlink(path.join(outside, 'secret.md'), path.join(app.root, 'tmpl/web/leak.md'));
        for (const url of ['/leak', '/leak.md', '/about.prompt.md', '/AGENTS.md', '/en/../about', '/en/%2e%2e/about', '/en/about.md.html', '/en/about%2emd', '/en/about.md/', '/xx/about.md', '/unrelated.md']) {
            const res = await app.send(url);
            assert.equal(res.status, 404, url);
            assert.doesNotMatch(res.body, /SIDECAR|SECRET|Instructions/);
        }
        assert.doesNotMatch((await app.generator.build()).llms, /prompt|AGENTS|unrelated|leak/);
    } finally { await fs.rm(app.root, {recursive: true, force: true}); await fs.rm(outside, {recursive: true, force: true}); }
});


it('supports unlocalized-only sites and ordinary HTML fallback without locale configuration', async () => {
    const app = await fixture({locales: [], defaultLocale: undefined});
    try {
        await app.write('tmpl/web/index.html', 'UNLOCALIZED HTML');
        assert.equal((await app.send('/')).body, 'UNLOCALIZED HTML');
        assert.equal((await app.send('/index.html')).body, 'UNLOCALIZED HTML');
        await app.write('tmpl/web/about.html', 'UNLOCALIZED ABOUT');
        assert.equal((await app.send('/about.html')).body, 'UNLOCALIZED ABOUT');
        await app.write('tmpl/web/about.md', text('Neutral only'));
        assert.equal((await app.send('/about', {accept: 'text/markdown'})).body, text('Neutral only'));
        assert.equal((await app.send('/about.md')).body, text('Neutral only'));
        assert.equal((await app.send('/about.html')).status, 404);
        const files = await app.generator.build();
        assert.match(files.llms, /- https:\/\/example.test\/about/);
        assert.doesNotMatch(files.sitemap, /<loc>/);
        await app.write('tmpl/web/publication.html', presentation);
        const html = await app.send('/about');
        assert.equal(html.status, 200);
        assert.match(html.body, /<main><h1>Neutral only<\/h1>/);
        assert.equal(app.rendered.at(-1).data.locale, '');
        assert.equal(app.rendered.at(-1).data.canonicalUrl, 'https://example.test/about');
        assert.match((await app.generator.build()).sitemap, /<loc>https:\/\/example.test\/about<\/loc>/);
    } finally { await fs.rm(app.root, {recursive: true, force: true}); }
});

it('selects format by explicit suffix before headers for both home and localized publications', async () => {
    const app = await fixture();
    try {
        await app.write('web/index.html', 'STATIC MUST NOT WIN');
        await app.write('tmpl/web/en/index.md', text('English home'));
        await app.write('tmpl/web/de/index.md', text('German home'));
        const browser = {'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml,*/*;q=0.8'};
        const agent = {'user-agent': 'ExampleBot/1.0', accept: '*/*'};
        for (const url of ['/', '/index', '/en', '/en/', '/en/index']) {
            const human = await app.send(url, browser);
            assert.equal(human.headers['content-type'], 'text/html; charset=utf-8', url);
            const neutral = ['/', '/index'].includes(url);
            assert.match(human.body, neutral ? /German home/ : /English home/);
            assert.equal(human.headers.vary, neutral ? 'Accept, User-Agent, Accept-Language' : 'Accept, User-Agent');
            assert.equal(app.rendered.at(-1).data.canonicalUrl, neutral ? 'https://example.test/de/' : 'https://example.test/en/');
            const machine = await app.send(url, agent);
            assert.equal(machine.body, text('English home'), url);
            assert.equal(machine.headers.vary, neutral ? 'Accept, User-Agent, Accept-Language' : 'Accept, User-Agent');
            assert.equal((await app.send(url, {...browser, accept: 'text/markdown'})).body, text('English home'));
            assert.equal((await app.send(url, {...agent, accept: 'text/html'})).headers['content-type'], 'text/html; charset=utf-8');
        }
        for (const url of ['/index.md', '/en/index.md']) {
            const res = await app.send(url, browser);
            assert.equal(res.body, text('English home'));
            assert.equal(res.headers.vary, undefined);
        }
        for (const [url, label] of [['/index.html', 'German home'], ['/en/index.html', 'English home']]) {
            const res = await app.send(url, {...agent, accept: 'text/markdown'});
            assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
            assert.match(res.body, new RegExp(`<h1>${label}</h1>`));
            assert.equal(res.headers.vary, url === '/index.html' ? 'Accept-Language' : undefined);
        }
        const rejected = await app.send('/', {accept: 'text/markdown;q=0,text/html;q=0'});
        assert.equal(rejected.status, 406);
        assert.equal(rejected.headers.vary, 'Accept, User-Agent, Accept-Language');
        await app.write('tmpl/web/de/publication.html', '');
        const unavailable = await app.send('/', browser);
        assert.equal(unavailable.status, 404);
        assert.equal(unavailable.headers.vary, 'Accept, User-Agent, Accept-Language');
        assert.equal((await app.send('/', agent)).status, 200);
    } finally { await fs.rm(app.root, {recursive: true, force: true}); }
});


it('selects human publication language from URL, then Accept-Language, then default without changing agent sources', async () => {
    for (const defaultLocale of ['en', 'ru']) {
        const app = await fixture({defaultLocale, locales: ['en', 'ru']});
        try {
            await app.write('tmpl/web/publication.html', presentation);
            for (const locale of ['en', 'ru']) {
                for (const route of ['index', 'about']) await app.write(`tmpl/web/${locale}/${route}.md`, text(locale));
            }
            const browser = {accept: 'text/html', 'user-agent': 'Mozilla/5.0'};
            for (const route of ['/', '/index', '/index.html', '/about', '/about.html']) {
                for (const [header, expected] of [
                    ['ru-RU,ru;q=0.9,en;q=0.8', 'ru'], ['en-US,en;q=0.9,ru;q=0.8', 'en'],
                    ['en;q=0.2,ru;q=0.9', 'ru'], ['RU-ru', 'ru'],
                    ['', defaultLocale], ['fr-FR', defaultLocale], ['*', defaultLocale],
                    ['en;q=0,ru;q=0.5', 'ru'], ['en;q=invalid,ru;q=0.5', 'ru'],
                ]) {
                    const res = await app.send(route, {...browser, 'accept-language': header});
                    assert.equal(res.status, 200, `${defaultLocale} ${route} ${header}`);
                    assert.equal(app.rendered.at(-1).data.publication.locale, expected);
                    assert.equal(app.rendered.at(-1).data.canonicalUrl,
                        `https://example.test/${expected}/${route.includes('about') ? 'about' : ''}`);
                    assert.equal(res.headers.vary, route.endsWith('.html') ? 'Accept-Language' : 'Accept, User-Agent, Accept-Language');
                }
            }
            for (const url of ['/en/', '/en/index.html', '/en/about', '/en/about.html']) {
                await app.send(url, {...browser, 'accept-language': 'ru'});
                assert.equal(app.rendered.at(-1).data.locale, 'en');
            }
            for (const url of ['/', '/index.md', '/about', '/about.md']) {
                const res = await app.send(url, {accept: 'text/markdown', 'accept-language': 'ru'});
                assert.equal(res.body, text('en'));
            }
            await fs.rm(path.join(app.root, 'tmpl/web/ru/about.md'));
            for (const url of ['/about', '/about.html', '/ru/about']) {
                assert.equal((await app.send(url, {...browser, 'accept-language': 'ru'})).status, 404);
            }
            await app.write('tmpl/web/ru/about.md', 'INVALID');
            assert.equal((await app.send('/about', {...browser, 'accept-language': 'ru'})).status, 404);
            await app.write('tmpl/web/index.md', text('Unlocalized'));
            assert.match((await app.send('/', {...browser, 'accept-language': 'ru'})).body, /Unlocalized/);
            await app.write('tmpl/web/index.md', 'INVALID');
            assert.equal((await app.send('/', {...browser, 'accept-language': 'ru'})).status, 404);
        } finally { await fs.rm(app.root, {recursive: true, force: true}); }
    }
});
