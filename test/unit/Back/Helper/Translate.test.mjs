import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Helper from '../../../../src/Back/Helper/Translate.mjs';

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
});
