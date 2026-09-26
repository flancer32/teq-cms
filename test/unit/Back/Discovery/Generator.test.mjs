import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Generator from '../../../../src/Back/Discovery/Generator.mjs';

it('writes public discovery files from the configured Markdown corpus', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-discovery-'));
    const generator = new Generator({
        config: {getBaseUrl: () => 'https://example.test', getPublicationMachineLocales: () => ['en']},
        tmplConfig: {getRootPath: () => root, getAvailableLocales: () => ['ru', 'en']},
        catalog: {list: async ({locale}) => locale === 'en'
            ? [{route: 'journal/second'}, {route: 'journal/first'}]
            : [{route: 'journal/first'}]},
        fs, path,
    });
    try {
        const files = await generator.write();
        assert.deepEqual(files.map(file => path.basename(file)), ['robots.txt', 'llms.txt', 'sitemap.xml']);
        const robots = await fs.readFile(path.join(root, 'web', 'robots.txt'), 'utf8');
        const llms = await fs.readFile(path.join(root, 'web', 'llms.txt'), 'utf8');
        const sitemap = await fs.readFile(path.join(root, 'web', 'sitemap.xml'), 'utf8');
        assert.match(robots, /Sitemap: https:\/\/example\.test\/sitemap\.xml/);
        assert.deepEqual(llms.match(/https:\/\/example\.test\/[^\s]+\.md/g), [
            'https://example.test/en/journal/first.md',
            'https://example.test/en/journal/second.md',
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
