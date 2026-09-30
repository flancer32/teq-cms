import {it} from 'node:test';
import assert from 'node:assert/strict';
import http2 from 'node:http2';
import ErrorRespond from '../../../../../src/Back/Web/Error/Respond.mjs';
import Policy from '../../../../../src/Back/Web/Error/Policy.mjs';
import Representation from '../../../../../src/Back/Publication/Representation.mjs';
import Respond from '../../../../../node_modules/@teqfw/web/src/Back/Helper/Respond.mjs';

function fixture(rendering = async () => ({resultCode: 'SUCCESS', content: '<h1>Missing</h1>'})) {
    const calls = [], logs = [];
    const policy = new Policy();
    const tmplConfig = {getAvailableLocales: () => ['en', 'ru'], getDefaultLocale: () => 'en'};
    const service = new ErrorRespond({policy,
        routing: {isEndpoint: path => path === '/agent/message', isStatic: path => path.startsWith('/assets/')},
        representation: new Representation(), tmplConfig,
        render: {perform: async data => { calls.push(data); return rendering(data); }},
        respond: new Respond({http2}), logger: {forSource: () => ({error: (...args) => logs.push(args)})}});
    const context = (url = '/ru/missing', headers = {}, method = 'GET') => ({
        request: {url, headers, method}, completed: false,
        response: {headersSent: false, writableEnded: false, writes: 0,
            writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true; this.writes++; },
            end(body) { this.body = body; this.writableEnded = true; }},
    });
    return {service, calls, logs, context, policy, tmplConfig};
}

it('uses URL then default for error language and exposes only safe data', async () => {
    const app = fixture();
    for (const [url, locale] of [['/ru/missing?token=SECRET', 'ru'], ['/missing', 'en'], ['/xx/missing', 'en']]) {
        const ctx = app.context(url, {'accept-language': 'ru', 'x-secret': 'SECRET'});
        await app.service.send({context: ctx});
        assert.equal(ctx.response.status, 404);
        assert.equal(ctx.response.headers['cache-control'], 'no-store');
        assert.equal(ctx.response.headers['x-robots-tag'], 'noindex, follow');
        assert.equal(ctx.response.headers['content-type'], 'text/html; charset=utf-8');
        assert.equal(ctx.response.headers['content-length'], String(Buffer.byteLength(ctx.response.body)));
        const args = app.calls.at(-1);
        assert.equal(args.target.name, '404.html');
        assert.equal(args.target.locales.user, locale);
        assert.deepEqual(args.data, {error: {status: 404, title: 'Not Found'}, statusCode: 404, locale, allowedLocales: ['en', 'ru']});
        assert.doesNotMatch(JSON.stringify(args), /SECRET|canonical|alternate|publication/);
    }
});

it('keeps Markdown, static, endpoint and non-page errors outside HTML rendering', async () => {
    const app = fixture();
    for (const [url, headers, type] of [
        ['/ru/missing.md', {accept: 'text/html'}, 'text/markdown'],
        ['/ru/missing', {'user-agent': 'ExampleBot'}, 'text/markdown'],
        ['/ru/missing', {accept: 'text/markdown'}, 'text/markdown'],
        ['/assets/missing.html', {accept: 'text/html'}, 'text/plain'],
        ['/file.css', {}, 'text/plain'],
        ['/agent/message', {}, 'application/json'],
        ['/api/missing', {}, 'application/json'],
        ['/unknown', {accept: 'text/html;q=0,text/markdown;q=0'}, 'text/plain'],
    ]) {
        const ctx = app.context(url, headers);
        await app.service.send({context: ctx});
        assert.equal(ctx.response.status, 404);
        assert.ok(ctx.response.headers['content-type'].startsWith(type));
        assert.equal(ctx.completed, true);
    }
    const ctx = app.context('/missing', {}, 'POST');
    await app.service.send({context: ctx});
    assert.equal(ctx.response.body, 'Not Found');
    assert.equal(app.calls.length, 0);
    const explicitHtml = app.context('/missing.html', {'user-agent': 'ExampleBot', accept: 'text/markdown'});
    await app.service.send({context: explicitHtml});
    assert.equal(explicitHtml.response.headers['content-type'], 'text/html; charset=utf-8');
});

it('falls back once for absent, empty, unreadable or failed templates', async () => {
    for (const result of [{resultCode: 'PATH_NOT_FOUND'}, {resultCode: 'TMPL_IS_EMPTY'},
        {resultCode: 'UNKNOWN_ERROR'}, {resultCode: 'SUCCESS', content: '   '}, new Error('PRIVATE')]) {
        const app = fixture(async () => { if (result instanceof Error) throw result; return result; });
        const ctx = app.context();
        await app.service.send({context: ctx});
        assert.equal(ctx.response.status, 404);
        assert.equal(ctx.response.body, 'Not Found');
        assert.equal(ctx.response.headers['content-type'], 'text/plain; charset=utf-8');
        assert.equal(app.calls.length, 1);
        assert.doesNotMatch(JSON.stringify(app.logs), /PRIVATE/);
        if (result instanceof Error || result.resultCode === 'UNKNOWN_ERROR') assert.equal(app.logs.length, 1);
    }
});

it('handles HEAD and never sends after completion or connection closure, including during rendering', async () => {
    const app = fixture();
    const head = app.context('/ru/missing', {}, 'HEAD');
    await app.service.send({context: head});
    assert.equal(head.response.body, '');
    assert.equal(head.response.status, 404);
    assert.equal(head.response.headers['content-length'], '16');
    for (const flag of ['completed', 'headersSent', 'writableEnded', 'destroyed', 'closed']) {
        const ctx = app.context();
        if (flag === 'completed') ctx.completed = true;
        else ctx.response[flag] = true;
        await app.service.send({context: ctx});
        assert.equal(ctx.response.writes, 0);
    }
    let pending;
    const closing = fixture(async () => { pending.response.destroyed = true; return {resultCode: 'SUCCESS', content: 'HTML'}; });
    pending = closing.context();
    await closing.service.send({context: pending});
    assert.equal(pending.response.writes, 0);
});


it('supports host section policy and unlocalized templates without locale configuration', async () => {
    const app = fixture();
    app.tmplConfig.getAvailableLocales = () => [];
    app.tmplConfig.getDefaultLocale = () => undefined;
    const decisions = [];
    app.policy.getTemplateName = args => { decisions.push(args); return 'errors/docs-404.html'; };
    await app.service.send({context: app.context('/docs/missing?token=SECRET')});
    assert.deepEqual(decisions, [{status: 404, locale: undefined, path: '/docs/missing'}]);
    assert.equal(app.calls[0].target.name, 'errors/docs-404.html');
    assert.deepEqual(app.calls[0].target.locales, {user: undefined, app: undefined});
    for (const name of [undefined, '../private.html', '/private.html', 'errors/../private.html']) {
        app.policy.getTemplateName = () => name;
        const ctx = app.context();
        await app.service.send({context: ctx});
        assert.equal(ctx.response.status, 404);
        assert.equal(ctx.response.body, 'Not Found');
    }
    const writes = app.calls.length;
    for (const url of ['/bad%2fpath', '/path/../other', '/path/./other', '/path//other']) {
        const ctx = app.context(url);
        await app.service.send({context: ctx});
        assert.equal(ctx.response.body, 'Not Found');
    }
    assert.equal(app.calls.length, writes);
});
