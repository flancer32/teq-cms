import {it} from 'node:test';
import assert from 'node:assert/strict';
import Handler from '../../../../../src/Back/Web/Handler/NotFound.mjs';
import Kahn from '../../../../../node_modules/@teqfw/web/src/Back/Helper/Order/Kahn.mjs';

it('sorts after every normal handler independently of registration order and delegates the response', async () => {
    const calls = [];
    const handler = new Handler({errors: {send: async value => calls.push(value)},
        dtoInfo: {create: value => value}, STAGE: {PROCESS: 'PROCESS'}});
    const before = handler.getRegistrationInfo().after.map(name => ({getRegistrationInfo: () => ({name, stage: 'PROCESS'})}));
    const host = {getRegistrationInfo: () => ({name: 'Host_Handler', stage: 'PROCESS', before: ['Fl32_Cms_Back_Web_Handler_NotFound']})};
    const ordered = new Kahn().sort([handler, host, ...before.reverse()]);
    assert.equal(ordered.at(-1), handler);
    const context = {};
    await handler.handle(context);
    assert.deepEqual(calls, [{context}]);
});
