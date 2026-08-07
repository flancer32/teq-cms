import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Store from '../../../../../src/Back/Store/Db/Translate.mjs';

function createStore(files = {}) {
    const writes = [];
    const directories = [];
    const fs = {
        readFile: async file => {
            if (!(file in files)) {
                const error = new Error('missing');
                error.code = 'ENOENT';
                throw error;
            }
            return files[file];
        },
        mkdir: async value => directories.push(value),
        writeFile: async (file, value, encoding) => writes.push({file, value, encoding}),
    };
    const store = new Store({
        fs,
        path: {
            join: (...parts) => parts.join('/'),
            resolve: value => `/resolved${value}`,
            dirname: value => value.slice(0, value.lastIndexOf('/')),
        },
        logger: {forSource: () => ({info: () => {}, warn: () => {}, error: () => {}})},
        tmplConfig: {getRootPath: () => '/project'},
    });
    return {store, writes, directories};
}

describe('Fl32_Cms_Back_Store_Db_Translate', () => {
    it('loads, queries, updates, and removes translation metadata', async () => {
        const {store} = createStore({
            '/resolved/project/var/teq-cms/db_translate.json': JSON.stringify({
                'about.html': {en: '2026-01-01T00:00:00.000Z'},
            }),
        });

        await store.init();
        assert.equal(store.getMtime('about.html', 'en'), '2026-01-01T00:00:00.000Z');
        assert.deepEqual(store.getLocales('about.html'), ['en']);
        store.setMtime('about.html', 'ru', '2026-01-02T00:00:00.000Z');
        assert.equal(store.getMtime('about.html', 'ru'), '2026-01-02T00:00:00.000Z');
        store.remove('about.html');
        assert.deepEqual(store.getData(), {});
    });

    it('initializes an empty database when the file is absent and saves it', async () => {
        const {store, writes, directories} = createStore();

        await store.init();
        store.setMtime('index.html', 'en', 'now');
        await store.save();

        assert.equal(directories[0], '/resolved/project/var/teq-cms');
        assert.deepEqual(writes, [{
            file: '/resolved/project/var/teq-cms/db_translate.json',
            value: JSON.stringify({'index.html': {en: 'now'}}, null, 2),
            encoding: 'utf-8',
        }]);
    });

    it('keeps an empty database when stored JSON is invalid', async () => {
        const {store} = createStore({
            '/resolved/project/var/teq-cms/db_translate.json': '{invalid',
        });

        await store.init();
        assert.deepEqual(store.getData(), {});
    });
});
