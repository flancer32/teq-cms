import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {marked} from 'marked';
import {parseDocument} from 'yaml';
import Source from '../../../../src/Back/Publication/Source.mjs';

it('loads only a validated publication within its locale root', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-source-'));
    try {
        const file = path.join(root, 'tmpl/web/en/notes/a.md');
        await fs.mkdir(path.dirname(file), {recursive: true});
        await fs.writeFile(file, '---\ntitle: A\ndescription: About A\ndate: 2026-09-23\n---\n# Body\n');
        const source = new Source({
        routing: {isSite: () => false, isStatic: () => false, isEndpoint: () => false, isPublicRoute: () => true, getFamilies: () => [{prefix: "notes", presentation: "page.html"}], getUrl: ({locale, route}) => locale ? `/${locale}/${route}` : `/${route}`},
        policy: {getPresentationName: () => "page.html"},
            fs, path, marked, parseDocument,
            tmplConfig: {getAvailableLocales: () => ['en', 'de'], getRootPath: () => root},
            config: {getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}]},
        });
        const item = await source.read({locale: 'en', route: 'notes/a'});
        assert.equal(item.metadata.title, 'A');
        assert.equal(item.markdown, '# Body\n');
        assert.equal(item.html, '<h1>Body</h1>\n');
        await fs.writeFile(file, '---\ntitle: A\ndescription: About A\ndate: 2026-09-23\nindexable: false\n---\n# Body\n');
        assert.equal((await source.read({locale: 'en', route: 'notes/a'})).metadata.indexable, false);
        await fs.writeFile(file, '---\ntitle: A\ndescription: About A\ndate: 2026-09-23\nindexable: "false"\n---\n# Body\n');
        await assert.rejects(source.read({locale: 'en', route: 'notes/a'}), /indexable must be a boolean/);
        assert.equal(await source.read({locale: 'de', route: 'notes/a'}), null);
        assert.equal(await source.read({locale: 'en', route: 'private/a'}), null);
        await assert.rejects(source.read({locale: 'en', route: 'notes/../a'}));
        await assert.rejects(source.read({locale: 'xx', route: 'notes/a'}));
        await fs.writeFile(file, '---\ntitle: A\ndescription: About A\ndate: 2026-02-31\n---\n# Body\n');
        await assert.rejects(source.read({locale: 'en', route: 'notes/a'}));
    } finally {
        await fs.rm(root, {recursive: true, force: true});
    }
});

it('selects only English or the optional tmpl default for neutral resources', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-neutral-source-'));
    try {
        const write = async (locale, route) => {
            const file = path.join(root, 'tmpl/web', locale, `notes/${route}.md`);
            await fs.mkdir(path.dirname(file), {recursive: true});
            await fs.writeFile(file, `---\ntitle: ${locale}\ndescription: Test\ndate: 2026-09-30\n---\n${locale}\n`);
        };
        await write('en', 'shared');
        await write('de', 'shared');
        await write('de', 'fallback');
        await write('ru', 'other');
        const make = defaultLocale => new Source({
        routing: {isSite: () => false, isStatic: () => false, isEndpoint: () => false, isPublicRoute: () => true, getFamilies: () => [{prefix: "notes", presentation: "page.html"}], getUrl: ({locale, route}) => locale ? `/${locale}/${route}` : `/${route}`},
        policy: {getPresentationName: () => "page.html"},
            fs, path, marked, parseDocument,
            tmplConfig: {getRootPath: () => root, getAvailableLocales: () => ['en', 'de', 'ru'], getDefaultLocale: () => defaultLocale},
            config: {getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}]},
        });
        const source = make('de');
        assert.equal((await source.readNeutral({route: 'notes/shared'})).locale, 'en');
        assert.equal((await source.readNeutral({route: 'notes/fallback'})).locale, 'de');
        assert.equal(await source.readNeutral({route: 'notes/other'}), null);
        assert.equal(await source.readNeutral({route: 'notes/missing'}), null);
        assert.equal(await make(undefined).readNeutral({route: 'notes/fallback'}), null);
        assert.equal(await make('en').readNeutral({route: 'notes/fallback'}), null);
        assert.equal(await source.readNeutral({route: 'notes/../private'}), null);
        await assert.rejects(source.read({locale: 'en', route: 'notes/../private'}));
        await fs.symlink(path.join(root, 'tmpl/web/en/notes/shared.md'), path.join(root, 'tmpl/web/en/notes/alias.md'));
        assert.equal(await source.readNeutral({route: 'notes/alias'}), null);
        await assert.rejects(source.read({locale: 'en', route: 'notes/alias'}), /escapes source root/);
    } finally {
        await fs.rm(root, {recursive: true, force: true});
    }
});
