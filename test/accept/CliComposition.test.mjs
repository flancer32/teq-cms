import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import Configurator from '../../bootstrap/di-config.mjs';

describe('TeqCMS CLI composition', () => {
    it('selects CMS implementations without owning configuration sources', () => {
        const configuration = new Configurator().configure({applicationRoot: process.cwd(), argv: []});
        assert.deepEqual(configuration.container.preprocessors,
            ['Fl32_Cms_Back_Di_Preprocessor$']);
        assert.equal(configuration.configuration, undefined);
    });
    it('generates neutral discovery through the real CLI host and package DI metadata', async () => {
        const project = path.resolve(import.meta.dirname, '../..');
        const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-cli-publication-'));
        try {
            for (const name of ['src', 'bootstrap', 'package.json']) {
                await fs.cp(path.join(project, name), path.join(root, name), {recursive: true});
            }
            await fs.symlink(path.join(project, 'node_modules'), path.join(root, 'node_modules'));
            await fs.writeFile(path.join(root, '.env'), [
                'TEQ_CMS__BASE_URL=https://example.test',
                'TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"docs","presentation":"publication.html"}]',
                'TEQFW_TMPL__ALLOWED_LOCALES=en,de,ru',
                'TEQFW_TMPL__DEFAULT_LOCALE=de',
                'TEQFW_TMPL__ENGINE=nunjucks',
                '',
            ].join('\n'));
            for (const [locale, route] of [['en', 'shared'], ['de', 'shared'], ['de', 'fallback'], ['ru', 'other']]) {
                const file = path.join(root, 'tmpl/web', locale, `docs/${route}.md`);
                await fs.mkdir(path.dirname(file), {recursive: true});
                await fs.writeFile(file, `---\ntitle: ${locale}\ndescription: CLI\ndate: 2026-09-30\n---\n${locale}\n`);
            }
            await fs.writeFile(path.join(root, 'tmpl/web/de/publication.html'), '<article>Publication</article>');
            await promisify(execFile)(process.execPath, [path.join(project, 'node_modules/@teqfw/cli/bin/teq.mjs'), '--host', '@flancer32/teq-cms', '--host-root', root, 'cms:generate'], {
                cwd: os.tmpdir(), timeout: 15000, env: {PATH: process.env.PATH},
            });
            const llms = await fs.readFile(path.join(root, 'web/llms.txt'), 'utf8');
            assert.deepEqual(llms.split('\n').filter(line => line.startsWith('- ')), [
                '- https://example.test/docs/fallback', '- https://example.test/docs/shared',
            ]);
            const sitemap = await fs.readFile(path.join(root, 'web/sitemap.xml'), 'utf8');
            assert.match(sitemap, /https:\/\/example.test\/ru\/docs\/other/);
            assert.doesNotMatch(sitemap, /\.md<\/loc>/);
            const dotenv = await fs.readFile(path.join(root, '.env'), 'utf8');
            await fs.writeFile(path.join(root, '.env'), dotenv.replace(
                'TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"docs","presentation":"publication.html"}]',
                'TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"docs","presentation":"publication.html"},{"prefix":"ru/docs","presentation":"publication.html"}]'
            ));
            await assert.rejects(promisify(execFile)(process.execPath, [
                path.join(project, 'node_modules/@teqfw/cli/bin/teq.mjs'),
                '--host', '@flancer32/teq-cms', '--host-root', root, 'cms:generate',
            ], {cwd: os.tmpdir(), timeout: 15000, env: {PATH: process.env.PATH}}), error => error.code === 1);
            assert.equal(await fs.readFile(path.join(root, 'web/sitemap.xml'), 'utf8'), sitemap);
        } finally {
            await fs.rm(root, {recursive: true, force: true});
        }
    });
});

it('generates site discovery with a host policy substituted through real CLI DI composition', async () => {
    const project = path.resolve(import.meta.dirname, '../..');
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-cli-site-'));
    try {
        for (const name of ['src', 'bootstrap', 'package.json']) {
            await fs.cp(path.join(project, name), path.join(root, name), {recursive: true});
        }
        await fs.symlink(path.join(project, 'node_modules'), path.join(root, 'node_modules'));
        const write = async (file, content) => {
            const target = path.join(root, file);
            await fs.mkdir(path.dirname(target), {recursive: true});
            await fs.writeFile(target, content);
        };
        await write('.env', 'TEQ_CMS__BASE_URL=https://example.test\nTEQFW_TMPL__ALLOWED_LOCALES=en,de\nTEQFW_TMPL__DEFAULT_LOCALE=de\n');
        const text = '---\ntitle: Page\ndescription: CLI\ndate: 2026-09-30\n---\nBody\n';
        for (const file of ['index.md', 'en/index.md', 'en/about.md', 'de/about.md', 'en/docs/page.md', 'en/assets/hidden.md', 'en/files/hidden.md']) {
            await write(`tmpl/web/${file}`, text);
        }
        await write('tmpl/web/de/publication.html', '<article>Default host presentation</article>');
        const run = () => promisify(execFile)(process.execPath, [path.join(project, 'node_modules/@teqfw/cli/bin/teq.mjs'),
            '--host', '@flancer32/teq-cms', '--host-root', root, 'cms:generate'], {cwd: os.tmpdir(), timeout: 15000, env: {PATH: process.env.PATH}});
        await run();
        const initial = await fs.readFile(path.join(root, 'web/llms.txt'), 'utf8');
        assert.match(initial, /- https:\/\/example.test\/\n/);
        assert.match(initial, /\/files\/hidden/);
        assert.doesNotMatch(initial, /\/assets\//);
        const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
        pkg.teqfw.fw.di.namespaces.push({prefix: 'Host_', path: './host', ext: '.mjs'});
        await write('package.json', JSON.stringify(pkg));
        await write('host/Policy.mjs', `export default class Policy {
            getMode = () => 'site';
            getStaticPrefixes = () => ['/assets/', '/files/'];
            getPresentationName = ({route}) => route.startsWith('docs/') ? 'docs.html' : 'page.html';
        }`);
        await write('host/Preprocessor.mjs', `export default function Preprocessor() {
            return depId => depId.address === 'Fl32_Cms_Back_Publication_Policy'
                ? Object.freeze({...depId, address: 'Host_Policy'}) : depId;
        }`);
        await write('bootstrap/di-config.mjs', `export default class Configurator {
            configure() { return {container: {preprocessors: ['Fl32_Cms_Back_Di_Preprocessor$', 'Host_Preprocessor$']}}; }
        }`);
        await write('tmpl/web/de/page.html', '<article>Host page</article>');
        await write('tmpl/web/de/docs.html', '<article>Host docs</article>');
        await fs.rm(path.join(root, 'tmpl/web/de/publication.html'));
        await run();
        const llms = await fs.readFile(path.join(root, 'web/llms.txt'), 'utf8');
        assert.deepEqual(llms.split('\n').filter(line => line.startsWith('- ')), [
            '- https://example.test/', '- https://example.test/about', '- https://example.test/docs/page',
        ]);
        const sitemap = await fs.readFile(path.join(root, 'web/sitemap.xml'), 'utf8');
        assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), [
            'https://example.test/de/about', 'https://example.test/en/', 'https://example.test/en/about', 'https://example.test/en/docs/page',
        ]);
        assert.doesNotMatch(sitemap, /assets|files|index|\.md|\.html/);
    } finally { await fs.rm(root, {recursive: true, force: true}); }
});
