import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Configurator from '../../../../bootstrap/configurator.mjs';
import Plugin from '../../../../src/Back/Cli/Plugin.mjs';
import Engine from '../../../../src/Back/Di/Replace/Tmpl/Engine.mjs';

describe('TeqCMS CLI composition', () => {
    it('selects the host template-engine wrapper in DI', () => {
        const configurator = new Configurator();
        const {preprocessors} = configurator.configure({applicationRoot: process.cwd(), argv: []});
        const preprocess = preprocessors[0];
        const dependency = {platform: 'node', moduleName: 'Fl32_Tmpl_Back_Api_Engine'};

        assert.equal(preprocess(dependency).moduleName, 'Fl32_Cms_Back_Di_Replace_Tmpl_Engine');
    });

    it('loads cfg before command resolution', async () => {
        const loaded = [];
        const plugin = new Plugin({
            loader: {load: async sources => loaded.push(sources)},
            object: {create: (values, id) => ({id, load: async () => Object.entries(values)
                .map(([key, value]) => ({key, value}))})},
            dotenv: {create: () => ({})},
            processEnv: {create: () => ({})},
            fs: {access: async () => { throw new Error('ENOENT'); }},
            path: {join: (...parts) => parts.join('/')},
        });

        await plugin.onStartup();

        assert.equal(loaded.length, 1);
    });

    it('normalizes locale lists from environment-backed sources', async () => {
        let loaded;
        const plugin = new Plugin({
            loader: {load: async sources => { loaded = await sources[1].load(); }},
            object: {create: (values, id) => ({id, load: async () => Object.entries(values)
                .map(([key, value]) => ({key, value}))})},
            dotenv: {create: () => ({
                id: 'project-dotenv',
                load: async () => [{key: 'TEQFW_TMPL__ALLOWED_LOCALES', value: 'en, es, ru'}],
            })},
            processEnv: {create: () => ({id: 'process-env', load: async () => []})},
            fs: {access: async () => {}},
            path: {join: (...parts) => parts.join('/')},
        });

        await plugin.onStartup();

        assert.deepEqual(loaded, [{
            key: 'TEQFW_TMPL__ALLOWED_LOCALES',
            value: ['en', 'es', 'ru'],
        }]);
    });

    it('delegates rendering to the engine selected by tmpl config', async () => {
        const selected = {render: async () => ({content: 'mustache'})};
        const engine = new Engine({
            config: {getEngine: () => 'mustache'},
            simple: {render: async () => ({content: 'simple'})},
            mustache: selected,
            nunjucks: {render: async () => ({content: 'nunjucks'})},
        });

        assert.deepEqual(await engine.render({template: 'x'}), {content: 'mustache'});
    });
});
