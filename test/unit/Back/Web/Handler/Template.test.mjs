import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Handler from '../../../../../src/Back/Web/Handler/Template.mjs';

function createHandler(overrides = {}) {
    const calls = [];
    const handler = new Handler({
        http2: {constants: {
            HTTP2_HEADER_CONTENT_ENCODING: 'content-encoding',
            HTTP2_HEADER_CONTENT_LENGTH: 'content-length',
            HTTP_STATUS_FOUND: 302,
        }},
        logger: {forSource: () => ({error: (...args) => calls.push(['error', ...args])})},
        respond: {
            isWritable: () => true,
            code200_Ok: value => calls.push(['ok', value]),
        },
        dtoInfo: {create: value => value},
        servTmplLoad: {perform: async () => ({template: 'template'})},
        servTmplRender: {perform: async () => ({content: 'Hello'})},
        adapter: {getRenderData: async () => ({
            target: {locales: {user: 'ru'}}, data: {}, options: {},
        })},
        tmplConfig: {getAvailableLocales: () => ['en', 'ru'], getDefaultLocale: () => 'en'},
        STAGE: {PROCESS: 'process'},
        ...overrides,
    });
    return {handler, calls};
}

describe('Fl32_Cms_Back_Web_Handler_Template', () => {
    it('redirects requests without a locale prefix', async () => {
        const {handler} = createHandler();
        const response = {writeHead: (...args) => response.head = args, end: () => response.ended = true};
        const context = {request: {url: '/about.html'}, response};

        await handler.handle(context);

        assert.deepEqual(response.head, [302, {location: '/ru/about.html'}]);
        assert.equal(response.ended, true);
        assert.equal(context.completed, true);
    });

    it('renders localized requests and completes the pipeline', async () => {
        const {handler, calls} = createHandler();
        const context = {request: {url: '/en/about.html'}, response: {}};

        await handler.handle(context);

        assert.equal(calls[0][0], 'ok');
        assert.equal(calls[0][1].body, 'Hello');
        assert.equal(context.completed, true);
    });

    it('stops quietly when the response is not writable', async () => {
        const {handler, calls} = createHandler({respond: {isWritable: () => false}});

        await handler.handle({request: {url: '/en/about.html'}, response: {}});

        assert.deepEqual(calls, []);
    });

    it('exposes handler registration metadata', () => {
        const {handler} = createHandler();
        assert.deepEqual(handler.getRegistrationInfo(), {
            name: 'Fl32_Cms_Back_Web_Handler_Template',
            stage: 'process',
            before: ['TeqFw_Web_Back_Handler_Static'],
        });
    });
});
