import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Plugin from '../../../../src/Back/Cli/Plugin.mjs';

describe('Fl32_Cms_Back_Cli_Plugin', () => {
    it('loads configuration and registers CMS web handlers', async () => {
        const calls = [];
        const handStatic = {init: async value => calls.push(['static', value])};
        const plugin = new Plugin({
            loader: {load: async sources => calls.push(['load', sources])},
            object: {create: (values, id) => ({id, load: async () => Object.entries(values).map(([key, value]) => ({key, value}))})},
            dotenv: {create: () => ({id: 'dotenv', load: async () => []})},
            processEnv: {create: () => ({id: 'env', load: async () => []})},
            pipeline: {addHandler: handler => calls.push(['handler', handler])},
            handLog: 'log',
            handStatic,
            handTmpl: 'template',
            dtoSource: {create: value => { calls.push(['source', value]); return 'source'; }},
            fs: {access: async () => { throw new Error('ENOENT'); }},
            path: {join: (...parts) => parts.join('/')},
        });

        await plugin.onStartup();

        assert.equal(calls[0][0], 'load');
        assert.deepEqual(calls.slice(1), [
            ['source', {root: `${process.cwd()}/web`, prefix: '/', allow: {'.': ['.']}, defaults: ['index.html']}],
            ['static', {sources: ['source']}],
            ['handler', 'log'],
            ['handler', handStatic],
            ['handler', 'template'],
        ]);
    });
});
