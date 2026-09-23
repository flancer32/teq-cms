import {it} from 'node:test';
import assert from 'node:assert/strict';
import Handler from '../../../../src/Back/Publication/Handler.mjs';
import path from 'node:path';

it('blocks localized Markdown before source or template access', async () => {
    const calls = [];
    const handler = new Handler({
        config: {
            getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}],
            getPublicationMachineLocales: () => ['en'],
            getPublicationDiscoveryPath: () => '/llms.txt',
            getBaseUrl: () => 'https://example.test',
        },
        tmplConfig: {getAvailableLocales: () => ['en', 'de'], getDefaultLocale: () => 'de'},
        source: {getFamily: () => ({prefix: 'notes', presentation: 'page.html'}), read: async () => { calls.push('read'); }},
        catalog: {list: async () => { calls.push('catalog'); return []; }},
        dtoTarget: {create: value => value},
        render: {perform: async () => { calls.push('render'); return {resultCode: 'SUCCESS', content: ''}; }},
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
    for (const url of ['/de/notes/story.md', '/notes/story.md', '/en/notes/%2e%2e/story.md', '/en/notes/story%2emd']) {
        const context = {request: {url}, response: {}, completed: false};
        await handler.handle(context);
        assert.equal(context.response.status, 404);
        assert.equal(context.completed, true);
    }
    assert.deepEqual(calls, []);
});
