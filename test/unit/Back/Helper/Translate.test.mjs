import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Helper from '../../../../src/Back/Helper/Translate.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function createFileSystem() {
    const entries = [
        {name: 'index.html', isFile: () => true, isDirectory: () => false},
        {name: 'nested', isFile: () => false, isDirectory: () => true},
    ];
    const mtimes = {
        '/project/tmpl/web/ru/index.html': new Date('2026-01-01T00:00:00.000Z'),
        '/project/tmpl/web/ru/nested/about.html': new Date('2026-01-02T00:00:00.000Z'),
    };
    return {
        access: async path => {
            if (path !== '/project/tmpl/web/ru') throw new Error('ENOENT');
        },
        readdir: async path => path.endsWith('/nested')
            ? [{name: 'about.html', isFile: () => true, isDirectory: () => false}]
            : entries,
        stat: async path => ({mtime: mtimes[path]}),
        constants: {F_OK: 0},
    };
}

describe('Fl32_Cms_Back_Helper_Translate', () => {
    it('synchronizes base templates and removes obsolete database entries', async () => {
        const changes = [];
        const db = {
            getData: () => ({'old.html': {ru: 'old'}}),
            getMtime: (path, locale) => path === 'index.html' && locale === 'ru' ? null : undefined,
            setMtime: (path, locale, mtime) => changes.push(['set', path, locale, mtime]),
            remove: path => changes.push(['remove', path]),
        };
        const helper = new Helper({
            path: {
                join: (...parts) => parts.join('/'),
                resolve: value => value,
                relative: (from, to) => to.slice(from.length + 1),
            },
            fs: {promises: createFileSystem()},
            logger: {forSource: () => ({info: () => {}, warn: () => {}})},
            tmplConfig: {getRootPath: () => '/project'},
            config: {getLocaleBaseTranslate: () => 'ru'},
        });

        await helper.syncDbWithFilesystem(db);

        assert.deepEqual(changes, [
            ['set', 'index.html', 'ru', '2026-01-01T00:00:00.000Z'],
            ['set', 'nested/about.html', 'ru', '2026-01-02T00:00:00.000Z'],
            ['remove', 'old.html'],
        ]);
    });

    it('does not fail when the base locale directory is absent', async () => {
        const helper = new Helper({
            path: {join: (...parts) => parts.join('/'), resolve: value => value},
            fs: {promises: {
                access: async () => { throw new Error('ENOENT'); },
                constants: {F_OK: 0},
            }},
            logger: {forSource: () => ({info: () => {}, warn: () => {}})},
            tmplConfig: {getRootPath: () => '/project'},
            config: {getLocaleBaseTranslate: () => 'ru'},
        });

        await assert.doesNotReject(() => helper.syncDbWithFilesystem({getData: () => {}}));
    });

    it('tracks Markdown only inside configured families and skips prompt sidecars', async () => {
        const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cms-translate-scan-'));
        try {
            for (const rel of ['index.html', 'journal/post.md', 'journal/post.prompt.md', 'other/out.md']) {
                const file = path.join(root, 'tmpl/web/en', rel);
                await fs.promises.mkdir(path.dirname(file), {recursive: true});
                await fs.promises.writeFile(file, 'content');
            }
            const found = [];
            const helper = new Helper({
                fs, path,
                logger: {forSource: () => ({info() {}, warn() {}})},
                tmplConfig: {getRootPath: () => root},
                config: {getLocaleBaseTranslate: () => 'en', getPublicationFamilies: () => [{prefix: 'journal'}]},
            });
            await helper.syncDbWithFilesystem({
                getData: () => ({}), getMtime: () => null,
                setMtime: rel => found.push(rel), remove() {},
            });
            assert.deepEqual(found.sort(), ['index.html', 'journal/post.md']);
        } finally {
            await fs.promises.rm(root, {recursive: true, force: true});
        }
    });
});
