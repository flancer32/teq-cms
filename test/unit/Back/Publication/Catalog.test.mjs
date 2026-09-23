import {it} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import Catalog from '../../../../src/Back/Publication/Catalog.mjs';

it('enumerates only opted-in Markdown files in stable route order', async () => {
    const calls = [];
    const file = name => ({name, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false});
    const directory = name => ({name, isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false});
    const catalog = new Catalog({
        fs: {realpath: async value => value, readdir: async dir => dir.endsWith('/notes')
            ? [file('z.md'), file('ignored.txt'), directory('inner'), {name: 'leak.md', isSymbolicLink: () => true}]
            : dir.endsWith('/notes/inner') ? [file('a.md')] : []},
        path,
        tmplConfig: {getRootPath: () => '/app', getAvailableLocales: () => ['en']},
        config: {getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}]},
        source: {read: async input => { calls.push(input); return {...input, metadata: {title: input.route}}; }},
    });
    const result = await catalog.list({locale: 'en'});
    assert.deepEqual(result.map(item => item.route), ['notes/inner/a', 'notes/z']);
    assert.deepEqual(calls.map(item => item.route), ['notes/z', 'notes/inner/a']);
    await assert.rejects(catalog.list({locale: '../en'}));
});
