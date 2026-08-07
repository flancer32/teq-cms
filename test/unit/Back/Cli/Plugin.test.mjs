import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Plugin from '../../../../src/Back/Cli/Plugin.mjs';

describe('Fl32_Cms_Back_Cli_Plugin', () => {
    it('registers CMS web handlers using the configured application root', async () => {
        const calls = [];
        const handStatic = {init: async value => calls.push(['static', value])};
        const plugin = new Plugin({
            pipeline: {addHandler: handler => calls.push(['handler', handler])},
            handLog: 'log',
            handStatic,
            handTmpl: 'template',
            dtoSource: {create: value => { calls.push(['source', value]); return 'source'; }},
            tmplConfig: {getRootPath: () => '/application'},
            path: {join: (...parts) => parts.join('/')},
        });

        await plugin.onStartup();

        assert.deepEqual(calls, [
            ['source', {root: '/application/web', prefix: '/', allow: {'.': ['.']}, defaults: ['index.html']}],
            ['static', {sources: ['source']}],
            ['handler', 'log'],
            ['handler', handStatic],
            ['handler', 'template'],
        ]);
    });
});
