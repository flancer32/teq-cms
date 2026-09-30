import {it} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import StaticRoute from '../../../../../src/Back/Web/Handler/StaticRoute.mjs';

it('terminates static exclusions without template fallback and rejects encoded or normalized paths', async () => {
    const calls = [];
    const handler = new StaticRoute({
        routing: {isEndpoint: () => false, isStatic: value => value.startsWith('/assets/')},
        handStatic: {handle: async context => { calls.push(context.request.url); }},
        errors: {send: async ({context}) => { context.response.status = 404; context.completed = true; }},
        respond: {isWritable: () => true, code404_NotFound: ({res}) => { res.status = 404; }},
        dtoInfo: {create: value => value}, STAGE: {PROCESS: 'PROCESS'}, path,
    });
    for (const url of ['/assets/missing', '/assets/../private', '/assets//x', '/%61ssets/x']) {
        const context = {request: {url}, response: {}, completed: false};
        await handler.handle(context);
        assert.equal(context.response.status, 404);
        assert.equal(context.completed, true);
    }
    assert.deepEqual(calls, ['/assets/missing']);
    const other = {request: {url: '/assets-other/page'}, response: {}, completed: false};
    await handler.handle(other);
    assert.equal(other.completed, false);
});
