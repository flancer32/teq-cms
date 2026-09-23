import {it} from 'node:test';
import assert from 'node:assert/strict';
import Fetch from '../../../../src/Back/Platform/Fetch.mjs';

it('forwards fetch input and options to the platform function', async () => {
    const original = globalThis.fetch;
    const calls = [];
    try {
        globalThis.fetch = async (...args) => { calls.push(args); return {ok: true}; };
        const response = await new Fetch({}).fetch('https://example.test', {method: 'POST'});
        assert.deepEqual(calls, [['https://example.test', {method: 'POST'}]]);
        assert.deepEqual(response, {ok: true});
    } finally {
        globalThis.fetch = original;
    }
});
