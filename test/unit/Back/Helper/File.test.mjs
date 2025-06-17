import {describe, it} from 'node:test';
import assert from 'assert';
import path from 'node:path';
import {buildTestContainer} from '../../common.js';

describe('Fl32_Cms_Back_Helper_File.resolveTemplateName', () => {
    const container = buildTestContainer();
    /** @type {string[]} */
    let accessible = [];

    container.register('node:fs', {
        promises: {
            access: async (p) => {
                if (!accessible.includes(p)) {
                    throw new Error('ENOENT');
                }
            },
        },
        constants: {R_OK: 4},
    });

    container.register('node:path', {
        join: (...args) => args.join('/'),
        extname: (p) => path.extname(p),
    });

    container.register('Fl32_Cms_Back_Config$', {
        getRootPath: () => '/root',
    });

    it('should return exact file when exists', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = ['/root/base/foo.txt'];
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'foo.txt'});
        assert.strictEqual(res, 'foo.txt');
    });

    it('should resolve index.html in folder', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = ['/root/base/bar/index.html'];
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'bar'});
        assert.strictEqual(res, 'bar/index.html');
    });

    it('should append .html when exists', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = ['/root/base/about.html'];
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'about'});
        assert.strictEqual(res, 'about.html');
    });

    it('should return undefined when not found', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = [];
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'miss'});
        assert.strictEqual(res, undefined);
    });
});
