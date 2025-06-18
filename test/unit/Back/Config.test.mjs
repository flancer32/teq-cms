import {describe, it} from 'node:test';
import assert from 'assert';
import {buildTestContainer} from '../common.js';

// Helper to create basic init args
function baseArgs(extra = {}) {
    return {
        aiApiBaseUrl: 'url',
        aiApiKey: 'key',
        aiApiModel: 'model',
        localeAllowed: ['en'],
        localeBaseTranslate: 'en',
        localeBaseWeb: 'en',
        rootPath: '/root',
        tmplEngine: 'nunjucks',
        serverPort: 3000,
        serverType: 'http',
        tlsCert: '',
        tlsKey: '',
        tlsCa: '',
        ...extra,
    };
}

describe('Fl32_Cms_Back_Config.getBaseUrl', () => {
    function createConfig(extra = {}) {
        const container = buildTestContainer();
        container.register('Fl32_Cms_Back_Helper_Cast$', {
            array: (v) => v,
            string: (v) => v,
            int: (v) => v,
        });
        container.register('Fl32_Tmpl_Back_Config$', {init: () => {}});
        container.register('Fl32_Web_Back_Server_Config$', {create: (v) => v});
        return (async () => {
            const cfg = await container.get('Fl32_Cms_Back_Config$');
            cfg.init(baseArgs(extra));
            return cfg;
        })();
    }

    it('should return configured baseUrl', async () => {
        const cfg = await createConfig({baseUrl: 'https://demo'});
        assert.strictEqual(cfg.getBaseUrl(), 'https://demo');
    });

    it('should fallback to empty string', async () => {
        const cfg = await createConfig();
        assert.strictEqual(cfg.getBaseUrl(), '');
    });
});
