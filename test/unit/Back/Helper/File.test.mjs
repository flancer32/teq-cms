import {describe, it} from 'node:test';
import assert from 'assert';
import path from 'node:path';
import {buildTestContainer} from '../../common.js';

describe('Fl32_Cms_Back_Helper_File.resolveTemplateName', () => {
    const container = buildTestContainer();
    /** @type {string[]} */
    let accessible = [];
    /** @type {Record<string, boolean>} */
    let files = {};

    container.register('node:fs', {
        promises: {
            access: async (p) => {
                if (!accessible.includes(p)) {
                    throw new Error('ENOENT');
                }
            },
            stat: async (p) => {
                if (p in files) return {isFile: () => files[p]};
                throw new Error('ENOENT');
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
        files = {'/root/base/foo.txt': true};
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'foo.txt'});
        assert.strictEqual(res, 'foo.txt');
    });

    it('should resolve index.html in folder', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = ['/root/base/bar/index.html'];
        files = {'/root/base/bar/index.html': true};
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'bar'});
        assert.strictEqual(res, 'bar/index.html');
    });

    it('should append .html when exists', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = ['/root/base/about.html'];
        files = {'/root/base/about.html': true};
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'about'});
        assert.strictEqual(res, 'about.html');
    });

    it('should not resolve when path is directory', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = ['/root/base/dir'];
        files = {'/root/base/dir': false};
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'dir'});
        assert.strictEqual(res, undefined);
    });

    it('should return undefined when not found', async () => {
        const helper = await container.get('Fl32_Cms_Back_Helper_File$');
        accessible = [];
        files = {};
        const res = await helper.resolveTemplateName({baseDir: '/root/base', cleanPath: 'miss'});
        assert.strictEqual(res, undefined);
    });
});
