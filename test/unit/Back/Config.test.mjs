import {describe, it, beforeEach} from 'node:test';
import assert from 'assert';
import {buildTestContainer} from '../common.js';

let container;

/**
 * Returns minimal init arguments for Fl32_Cms_Back_Config.
 */
function baseArgs(extra = {}) {
    return {
        aiApiBaseUrl: 'https://api.example.com/v1',
        aiApiKey: 'sk-123456',
        aiApiModel: 'gpt-4o',
        aiApiOrg: 'org-xyz',
        baseUrl: 'https://cms.example.com',
        localeAllowed: ['en', 'ru'],
        localeBaseTranslate: 'en',
        localeBaseWeb: 'en',
        rootPath: '/root/path',
        tmplEngine: 'nunjucks',
        serverPort: 3000,
        serverType: 'http',
        tlsCert: '',
        tlsKey: '',
        tlsCa: '',
        ...extra,
    };
}

describe('Fl32_Cms_Back_Config full init and getters', () => {
    beforeEach(() => {
        container = buildTestContainer();

        container.register('Fl32_Cms_Back_Helper_Cast$', {
            array: (v, cast) => v.map(cast),
            string: (v) => String(v),
            int: (v) => parseInt(v),
        });

        container.register('Fl32_Tmpl_Back_Config$', {
            init: () => {},
        });

        container.register('Fl32_Web_Back_Server_Config$', {
            create: (args) => ({mockServerDto: true, ...args}),
        });
    });

    it('should correctly initialize and expose all config values', async () => {
        const cfg = await container.get('Fl32_Cms_Back_Config$');
        const args = baseArgs();
        cfg.init(args);

        assert.strictEqual(cfg.getAiApiBaseUrl(), args.aiApiBaseUrl);
        assert.strictEqual(cfg.getAiApiKey(), args.aiApiKey);
        assert.strictEqual(cfg.getAiApiModel(), args.aiApiModel);
        assert.strictEqual(cfg.getAiApiOrg(), args.aiApiOrg);
        assert.strictEqual(cfg.getBaseUrl(), args.baseUrl);
        assert.deepStrictEqual(cfg.getLocaleAllowed(), args.localeAllowed);
        assert.strictEqual(cfg.getLocaleBaseTranslate(), args.localeBaseTranslate);
        assert.strictEqual(cfg.getLocaleBaseWeb(), args.localeBaseWeb);
        assert.strictEqual(cfg.getRootPath(), args.rootPath);

        const dto = cfg.getWebServerConfigDto();
        assert.ok(dto.mockServerDto); // confirms factory was called
        assert.strictEqual(dto.port, 3000);
        assert.strictEqual(dto.type, 'http');
        assert.strictEqual(dto.tls, undefined); // no TLS
    });

    it('should throw on second init call', async () => {
        const cfg = await container.get('Fl32_Cms_Back_Config$');
        cfg.init(baseArgs());
        assert.throws(() => {
            cfg.init(baseArgs());
        }, /already been initialized/);
    });
});
