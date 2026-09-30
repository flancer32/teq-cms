import {it} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import Catalog from '../../../../src/Back/Publication/Catalog.mjs';

it('enumerates only opted-in Markdown files in stable route order', async () => {
    const calls = [];
    const file = name => ({name, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false});
    const directory = name => ({name, isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false});
    const catalog = new Catalog({
        routing: {isSite: () => false, isStatic: () => false, isEndpoint: () => false, isPublicRoute: () => true, getFamilies: () => [{prefix: "notes", presentation: "page.html"}], getUrl: ({locale, route}) => locale ? `/${locale}/${route}` : `/${route}`},
        fs: {realpath: async value => value, readdir: async dir => dir.endsWith('/notes')
            ? [file('z.md'), file('ignored.txt'), directory('inner'), {name: 'leak.md', isSymbolicLink: () => true}]
            : dir.endsWith('/notes/inner') ? [file('a.md')] : []},
        path,
        tmplConfig: {getRootPath: () => '/app', getAvailableLocales: () => ['en']},
        config: {getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}]},
        source: {readAvailable: async input => { calls.push(input); return {...input, metadata: {title: input.route}}; }},
    });
    const result = await catalog.list({locale: 'en'});
    assert.deepEqual(result.map(item => item.route), ['notes/inner/a', 'notes/z']);
    assert.deepEqual(calls.map(item => item.route), ['notes/z', 'notes/inner/a']);
    await assert.rejects(catalog.list({locale: '../en'}));
});

it('deduplicates candidate routes and delegates neutral selection to Source', async () => {
    const calls = [];
    const file = name => ({name, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false});
    const catalog = new Catalog({
        routing: {isSite: () => false, isStatic: () => false, isEndpoint: () => false, isPublicRoute: () => true, getFamilies: () => [{prefix: "notes", presentation: "page.html"}], getUrl: ({locale, route}) => locale ? `/${locale}/${route}` : `/${route}`},
        fs: {realpath: async value => value, readdir: async dir => dir.endsWith('/en/notes')
            ? [file('shared.md')] : [file('shared.md'), file('default.md')]},
        path,
        tmplConfig: {getRootPath: () => '/app', getAvailableLocales: () => ['en', 'de', 'ru'], getDefaultLocale: () => 'de'},
        config: {getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}]},
        source: {
            readAvailable: async input => input,
            readNeutral: async ({route}) => { calls.push(route); return {route, locale: route.endsWith('default') ? 'de' : 'en'}; },
        },
    });
    assert.deepEqual(await catalog.listNeutral(), [
        {route: 'notes/default', locale: 'de'}, {route: 'notes/shared', locale: 'en'},
    ]);
    assert.deepEqual(calls, ['notes/default', 'notes/shared']);
});

it('checks presentation loading and filters HTML without changing source enumeration', async () => {
    const family = {prefix: 'notes', presentation: 'page.html'};
    let result = {resultCode: 'SUCCESS', template: '<article>Page</article>'};
    const targets = [];
    const catalog = new Catalog({
        routing: {isSite: () => false, isStatic: () => false, isEndpoint: () => false, isPublicRoute: () => true, getFamilies: () => [{prefix: "notes", presentation: "page.html"}], getUrl: ({locale, route}) => locale ? `/${locale}/${route}` : `/${route}`},
        fs: {realpath: async value => value, readdir: async () => [
            {name: 'a.md', isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false},
        ]},
        path,
        tmplConfig: {getRootPath: () => '/app', getAvailableLocales: () => ['en'], getDefaultLocale: () => 'de'},
        config: {getPublicationFamilies: () => [family]},
        source: {readAvailable: async input => ({...input, family})},
        dtoTarget: {create: target => { targets.push(target); return target; }},
        load: {perform: async () => result},
    });
    assert.equal((await catalog.listHtml({locale: 'en'})).length, 1);
    assert.deepEqual(targets[0], {type: 'web', name: 'page.html', locales: {user: 'en', app: 'de'}});
    for (result of [
        {resultCode: 'PATH_NOT_FOUND', template: null},
        {resultCode: 'UNKNOWN_ERROR', template: null},
        {resultCode: 'SUCCESS', template: ''},
        {resultCode: 'SUCCESS', template: '  \n'},
    ]) {
        assert.deepEqual(await catalog.listHtml({locale: 'en'}), []);
        assert.equal((await catalog.list({locale: 'en'})).length, 1);
    }
});
