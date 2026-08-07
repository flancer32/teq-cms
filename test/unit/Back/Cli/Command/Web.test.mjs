import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Command from '../../../../../src/Back/Cli/Command/Web.mjs';

describe('Fl32_Cms_Back_Cli_Command_Web', () => {
    it('configures handlers, starts the server, and stops it on request', async () => {
        const calls = [];
        let abort;
        const handStatic = {init: async value => calls.push(['static-init', value])};
        const command = new Command({
            path: {join: (...parts) => parts.join('/')},
            tmplConfig: {getRootPath: () => '/project'},
            configFactory: {freeze: () => calls.push('freeze')},
            dispatcher: {addHandler: handler => calls.push(['handler', handler])},
            handLog: 'log',
            handStatic,
            handTmpl: 'tmpl',
            dtoSource: {create: value => {
                calls.push(['source', value]);
                return 'source';
            }},
            server: {start: async () => calls.push('start'), stop: async () => calls.push('stop')},
        });
        const signal = {addEventListener: (event, listener, options) => {
            assert.equal(event, 'abort');
            assert.deepEqual(options, {once: true});
            abort = listener;
        }};

        const result = await command.start({signal});
        assert.equal(command.id, 'web:start');
        assert.deepEqual(calls, [
            ['source', {root: '/project/web', prefix: '/', allow: {'.': ['.']}, defaults: ['index.html']}],
            ['static-init', {sources: ['source']}],
            ['handler', 'log'],
            ['handler', handStatic],
            ['handler', 'tmpl'],
            'freeze',
            'start',
        ]);

        let completed = false;
        result.done.then(() => { completed = true; });
        abort();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(completed, true);
        await result.stop();
        assert.equal(calls.at(-1), 'stop');
    });
});
