import {describe, it} from 'node:test';
import assert from 'assert';
import path from 'node:path';
import {buildTestContainer} from '../../../common.js';

describe('Fl32_Cms_Back_Di_Replace_Adapter', () => {
    const container = buildTestContainer();

    /** @type {string[]} */
    let accessiblePaths = [];
    /** @type {Record<string, boolean>} */
    let fileStatuses = {};

    // Register mocks
    container.register('node:fs', {
        promises: {
            access: async (p) => {
                if (!accessiblePaths.includes(p)) {
                    throw new Error('ENOENT');
                }
            },
            stat: async (p) => {
                if (p in fileStatuses) return {isFile: () => fileStatuses[p]};
                throw new Error('ENOENT');
            },
        },
        constants: {
            R_OK: 4,
        },
    });

    container.register('node:path', {
        join: (...args) => args.join('/'),
        extname: (p) => path.extname(p),
    });

    container.register('Fl32_Cms_Back_Config$', {
        getLocaleAllowed: () => ['en', 'ru'],
        getLocaleBaseWeb: () => 'en',
        getRootPath: () => '/abs/app/root',
    });

    container.register('Fl32_Tmpl_Back_Dto_Target$', {
        create: ({type, name, locales}) => ({type, name, locales}),
    });

    it('should resolve index.html in folder path', async () => {
        const Adapter = await container.get('Fl32_Cms_Back_Di_Replace_Adapter$');
        accessiblePaths = ['/abs/app/root/tmpl/web/en/path/to/index.html'];
        fileStatuses = {'/abs/app/root/tmpl/web/en/path/to/index.html': true};

        const result = await Adapter.getRenderData({
            req: {url: '/ru/path/to/', headers: {}, socket: {}},
        });

        assert.strictEqual(result.target.name, 'path/to/index.html');
    });

    it('should resolve clean .html file', async () => {
        const Adapter = await container.get('Fl32_Cms_Back_Di_Replace_Adapter$');
        accessiblePaths = ['/abs/app/root/tmpl/web/en/about.html'];
        fileStatuses = {'/abs/app/root/tmpl/web/en/about.html': true};

        const result = await Adapter.getRenderData({
            req: {url: '/ru/about.html', headers: {}, socket: {}},
        });

        assert.strictEqual(result.target.name, 'about.html');
    });

    it('should pass through non-html file', async () => {
        const Adapter = await container.get('Fl32_Cms_Back_Di_Replace_Adapter$');
        accessiblePaths = ['/abs/app/root/tmpl/web/en/style.css'];
        fileStatuses = {'/abs/app/root/tmpl/web/en/style.css': true};

        const result = await Adapter.getRenderData({
            req: {url: '/style.css', headers: {}, socket: {}},
        });

        assert.strictEqual(result.target.name, 'style.css');
    });

    it('should return undefined for missing template', async () => {
        const Adapter = await container.get('Fl32_Cms_Back_Di_Replace_Adapter$');
        accessiblePaths = [];
        fileStatuses = {};

        const result = await Adapter.getRenderData({
            req: {url: '/ru/missing/page', headers: {}, socket: {}},
        });

        assert.strictEqual(result.target, undefined);
        assert.strictEqual(result.data, undefined);
        assert.strictEqual(result.options, undefined);
    });
});
