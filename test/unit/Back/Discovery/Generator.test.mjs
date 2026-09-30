import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseSitemap} from '../../../support/sitemap.mjs';
import Generator from '../../../../src/Back/Discovery/Generator.mjs';

it('writes public discovery files from the configured Markdown corpus', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-discovery-'));
    const generator = new Generator({
        routing: {getMarkdownUrl: ({route}) => `/${route}.md`, isSite: () => false, isStatic: () => false, isEndpoint: () => false, isPublicRoute: () => true, getFamilies: () => [{prefix: "notes", presentation: "page.html"}], getUrl: ({locale, route}) => locale ? `/${locale}/${route}` : `/${route}`},
        config: {getBaseUrl: () => 'https://example.test', getSitemapRepresentations: () => 'html'},
        tmplConfig: {getRootPath: () => root, getAvailableLocales: () => ['ru', 'en']},
        catalog: {
            listNeutral: async () => [{route: 'journal/first', metadata: {}}, {route: 'journal/second', metadata: {}}],
            listRepresentations: async () => [
                {representation: 'html', url: '/en/journal/first'},
                {representation: 'html', url: '/en/journal/second'},
                {representation: 'html', url: '/ru/journal/first'},
                {representation: 'markdown', url: '/journal/first.md'},
            ],
        },
        fs, path,
    });
    try {
        const files = await generator.write();
        assert.deepEqual(files.map(file => path.basename(file)), ['robots.txt', 'llms.txt', 'sitemap.xml']);
        const robots = await fs.readFile(path.join(root, 'web', 'robots.txt'), 'utf8');
        const llms = await fs.readFile(path.join(root, 'web', 'llms.txt'), 'utf8');
        const sitemap = await fs.readFile(path.join(root, 'web', 'sitemap.xml'), 'utf8');
        assert.match(robots, /Sitemap: https:\/\/example\.test\/sitemap\.xml/);
        assert.deepEqual(llms.match(/https:\/\/example\.test\/[^\s]+/g), [
            'https://example.test/journal/first.md',
            'https://example.test/journal/second.md',
        ]);
        assert.match(sitemap, /https:\/\/example\.test\/ru\/journal\/first/);
        assert.doesNotMatch(sitemap, /\.md<\/loc>/);
        await fs.rm(path.join(root, 'web', 'llms.txt'));
        await fs.symlink(path.join(root, 'outside.txt'), path.join(root, 'web', 'llms.txt'));
        await assert.rejects(generator.write(), /Refusing to replace symbolic link/);
    } finally {
        await fs.rm(root, {recursive: true, force: true});
    }
});

it('selects formats, deduplicates absolute URLs, and XML-escapes locations', async () => {
    let selection = 'both';
    const generator = new Generator({
        config: {getBaseUrl: () => 'https://example.test', getSitemapRepresentations: () => selection},
        routing: {getMarkdownUrl: ({route}) => `/${route}.md`},
        tmplConfig: {getAvailableLocales: () => ['en']},
        catalog: {
            listNeutral: async () => [{route: 'page', metadata: {}}, {route: 'hidden', metadata: {indexable: false}}],
            listRepresentations: async () => [
                {representation: 'markdown', url: '/page.md'},
                {representation: 'html', url: "/en/quo'te?x=1&y=2"},
                {representation: 'markdown', url: '/page.md'},
            ],
        },
    });
    const mixed = await generator.build();
    assert.match(mixed.sitemap, /quo&apos;te\?x=1&amp;y=2/);
    assert.deepEqual(parseSitemap(mixed.sitemap), ["https://example.test/en/quo'te?x=1&y=2", 'https://example.test/page.md']);
    assert.doesNotMatch(mixed.llms, /hidden/);
    selection = 'markdown';
    assert.deepEqual(parseSitemap((await generator.build()).sitemap), ['https://example.test/page.md']);
    selection = 'html';
    assert.deepEqual(parseSitemap((await generator.build()).sitemap), ["https://example.test/en/quo'te?x=1&y=2"]);
});
