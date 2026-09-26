import {it} from 'node:test';
import assert from 'node:assert/strict';
import Generate from '../../../../../src/Back/Cli/Command/Generate.mjs';

it('exposes a finite discovery generation command', async () => {
    let calls = 0;
    const command = new Generate({generator: {write: async () => { calls++; }}});
    assert.equal(command.id, 'cms:generate');
    assert.equal(command.lifetime, 'finite');
    await command.execute({args: {}});
    assert.equal(calls, 1);
});
