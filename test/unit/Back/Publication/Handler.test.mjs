import {it} from 'node:test';
import assert from 'node:assert/strict';
import Representation from '../../../../src/Back/Publication/Representation.mjs';
import Handler from '../../../../src/Back/Publication/Handler.mjs';
import path from 'node:path';

it('blocks invalid locales and unsafe logical routes before source or template access', async () => {
    const calls = [];
    const handler = new Handler({
        helpWeb: {extractLocale: () => 'de'},
        representation: new Representation(),
        routing: {isSite: () => false, isStatic: () => false, isEndpoint: () => false, isPublicRoute: () => true, getFamilies: () => [{prefix: "notes", presentation: "page.html"}], getUrl: ({locale, route}) => locale ? `/${locale}/${route}` : `/${route}`},
        config: {
            getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}],
            getBaseUrl: () => 'https://example.test',
        },
        tmplConfig: {getAvailableLocales: () => ['en', 'de'], getDefaultLocale: () => 'de'},
        source: {getFamily: route => /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(route) ? {prefix: 'notes', presentation: 'page.html'} : undefined, readAvailable: async () => { calls.push('read'); }},
        catalog: {getPresentation: async () => { calls.push('presentation'); return null; }},
        render: {perform: async () => { calls.push('render'); return {resultCode: 'SUCCESS', content: ''}; }},
        errors: {send: async ({context}) => { context.response.status = 404; context.completed = true; }},
        respond: {
            isWritable: () => true,
            code404_NotFound: ({res}) => { res.status = 404; },
            code200_Ok: ({res}) => { res.status = 200; },
        },
        dtoInfo: {create: value => value}, STAGE: {PROCESS: 'PROCESS'},
        logger: {forSource: () => ({error() {}})},
        path,
    });
    assert.deepEqual(handler.getRegistrationInfo().before,
        ['Fl32_Cms_Back_Web_Handler_Template', 'TeqFw_Web_Back_Handler_Static']);
    for (const url of ['/xx/notes/story', '/xx/notes/story.md', '/xx/notes/story.html', '/en/notes/story.txt', '/en/notes/story.md.html', '/notes/story.html.md', '/en/notes/story.MD', '/en/notes/.md', '/notes/.html', '/en/notes/%2e%2e/story.md', '/en/notes/story%2emd']) {
        const context = {request: {url}, response: {}, completed: false};
        await handler.handle(context);
        assert.equal(context.response.status, 404);
        assert.equal(context.completed, true);
    }
    assert.deepEqual(calls, []);
});
