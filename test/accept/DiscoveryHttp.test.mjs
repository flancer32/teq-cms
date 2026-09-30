import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {parseSitemap} from '../support/sitemap.mjs';

const project = path.resolve(import.meta.dirname, '../..');
const cli = path.join(project, 'node_modules/@teqfw/cli/bin/teq.mjs');
const content = (label, extra = '') => `---\ntitle: ${label}\ndescription: Discovery\ndate: 2026-09-30\n${extra}---\n# ${label}\n`;

for (const mode of ['site', 'families']) {
    it(`generates complete deterministic representation discovery served through CLI HTTP in ${mode} mode`, {timeout: 30000}, async () => {
        const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-discovery-http-'));
        let child;
        let output = '';
        try {
            const write = async (file, value) => {
                const target = path.join(root, file);
                await fs.mkdir(path.dirname(target), {recursive: true});
                await fs.writeFile(target, value);
            };
            for (const name of ['src', 'bootstrap', 'package.json']) await fs.cp(path.join(project, name), path.join(root, name), {recursive: true});
            await fs.symlink(path.join(project, 'node_modules'), path.join(root, 'node_modules'));
            const reservation = http.createServer();
            reservation.listen(0, '127.0.0.1');
            await once(reservation, 'listening');
            const port = reservation.address().port;
            await new Promise((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
            const origin = `http://127.0.0.1:${port}`;
            const dotenv = selection => [
                `TEQ_CMS__BASE_URL=${origin}`, `TEQ_CMS__SITEMAP_REPRESENTATIONS=${selection}`,
                ...(mode === 'families' ? ['TEQ_CMS__PUBLICATION_FAMILIES=[{"prefix":"docs","presentation":"publication.html"},{"prefix":"raw","presentation":"missing.html"}]'] : []),
                'TEQFW_TMPL__ALLOWED_LOCALES=ru,de,en', 'TEQFW_TMPL__DEFAULT_LOCALE=de',
                'TEQFW_TMPL__ENGINE=nunjucks', 'TEQFW_WEB__HOST=127.0.0.1', `TEQFW_WEB__PORT=${port}`, '',
            ].join('\n');
            await write('.env', dotenv('both'));
            // Real host DI policy: shared static exclusions and a missing presentation for one route.
            const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
            pkg.teqfw.fw.di.namespaces.push({prefix: 'Host_', path: './host', ext: '.mjs'});
            await write('package.json', JSON.stringify(pkg));
            await write('host/Policy.mjs', `export default class Policy {
                getMode = () => '${mode}';
                getStaticPrefixes = () => ['/assets/', '/files/', '/docs/files/'];
                getPresentationName = ({route}) => route === 'raw' ? 'missing.html' : 'publication.html';
            }`);
            await write('host/Preprocessor.mjs', `export default function Preprocessor() {
                return depId => depId.address === 'Fl32_Cms_Back_Publication_Policy'
                    ? Object.freeze({...depId, address: 'Host_Policy'}) : depId;
            }`);
            await write('bootstrap/di-config.mjs', `export default class Configurator {
                configure() { return {container: {preprocessors: ['Fl32_Cms_Back_Di_Preprocessor$', 'Host_Preprocessor$']}}; }
            }`);
            await write('tmpl/web/de/publication.html', '<link rel="canonical" href="{{ canonicalUrl }}">{% for language, url in alternateUrls %}<a hreflang="{{ language }}" href="{{ url }}"></a>{% endfor %}{% if markdownAlternateUrl %}<link rel="alternate" type="text/markdown" href="{{ markdownAlternateUrl }}">{% endif %}<main>{{ publication.html | safe }}</main>');
            const route = name => mode === 'families' ? `docs/${name}` : name;
            const variants = [
                ['en', 'about'], ['ru', 'about'], ['en', 'single'], ['de', 'fallback'], ['ru', 'other'],
                ['en', 'index'], ['ru', 'index'], ['en', 'nested/index'], ['ru', 'broken'], ['ru', 'optout'],
            ];
            for (const [locale, name] of variants) await write(`tmpl/web/${locale}/${route(name)}.md`, content(`${locale}-${name}`));
            await write(`tmpl/web/en/${route('broken')}.md`, 'invalid');
            await write(`tmpl/web/en/${route('optout')}.md`, content('optout', 'indexable: false\n'));
            await write(`tmpl/web/en/${route('hidden')}.md`, content('hidden', 'indexable: false\n'));
            await write(`tmpl/web/en/${route('invalid-indexable')}.md`, content('invalid', 'indexable: "false"\n'));
            await write(`tmpl/web/en/${route('prompt')}.prompt.md`, content('sidecar'));
            await write('tmpl/web/en/agent/message.md', content('reserved'));
            await write('tmpl/web/en/assets/hidden.md', content('asset'));
            await write('tmpl/web/en/files/hidden.md', content('excluded'));
            await write('tmpl/web/en/docs/files/hidden.md', content('excluded family'));
            await write('tmpl/web/en/404.html', 'Error presentation');
            await write('tmpl/web/en/ordinary.html', 'Ordinary page outside discovery');
            await write('tmpl/web/en/includes/layout.html', 'Include');
            await write('var/private.md', content('private'));
            await write('web/assets/ready.txt', 'Ready');
            if (mode === 'families') await write('tmpl/web/en/raw/page.md', content('en-raw'));
            if (mode === 'site') {
                for (const name of ['plain', 'index']) await write(`tmpl/web/${name}.md`, content(`unlocalized-${name}`));
                await write('tmpl/web/en/raw.md', content('en-raw'));
                await write('tmpl/web/en/plain.md', content('en-plain'));
                // Corrupt neutral candidate cannot suppress the valid exact Russian variant.
                await write('tmpl/web/blocked.md', 'invalid');
                await write('tmpl/web/ru/blocked.md', content('ru-blocked'));
            }
            const args = command => [cli, '--host', '@flancer32/teq-cms', '--host-root', root, command];
            const generate = () => promisify(execFile)(process.execPath, args('cms:generate'), {cwd: os.tmpdir(), env: {PATH: process.env.PATH}, timeout: 15000});
            const read = name => fs.readFile(path.join(root, 'web', name), 'utf8');
            await generate();
            const mixed = await read('sitemap.xml');
            const llms = await read('llms.txt');
            const robots = await read('robots.txt');
            await generate();
            assert.equal(await read('sitemap.xml'), mixed);
            assert.equal(await read('llms.txt'), llms);
            assert.equal(await read('robots.txt'), robots);
            const urls = parseSitemap(mixed);
            const markdownPaths = [
                `/${route('about')}.md`, `/ru/${route('about')}.md`, `/${route('single')}.md`,
                `/${route('fallback')}.md`, `/ru/${route('other')}.md`, `/ru/${route('broken')}.md`,
                `/${route('index')}.md`, `/ru/${route('index')}.md`, `/${route('nested/index')}.md`, `/ru/${route('optout')}.md`,
            ];
            const htmlPaths = variants.map(([locale, name]) => mode === 'site' && name === 'index' ? `/${locale}/` : `/${locale}/${route(name)}`);
            if (mode === 'site') {
                markdownPaths.push('/plain.md', '/en/plain.md', '/en/index.md', '/raw.md', '/ru/blocked.md');
                htmlPaths.push('/', '/plain', '/en/plain', '/ru/blocked');
            }
            if (mode === 'families') markdownPaths.push('/raw/page.md');
            const expected = [...htmlPaths, ...markdownPaths].map(value => origin + value).sort();
            assert.deepEqual(urls, expected);
            assert.doesNotMatch(mixed + llms, /hidden|invalid-indexable|prompt|agent\/message|assets|files|ordinary|404|includes|private/);
            assert.ok(!urls.includes(origin + `/en/${route('about')}.md`));
            assert.ok(!urls.includes(origin + `/en/${route('about')}.html`));
            assert.match(llms, new RegExp(`${route('about')}\\.md`));
            assert.ok(!llms.includes(`/ru/${route('about')}.md`));
            assert.ok(!llms.includes('optout'));
            assert.ok(!urls.includes(origin + `/${route('optout')}.md`));
            assert.ok(!urls.includes(origin + `/en/${route('optout')}.md`));
            for (const [selection, paths] of [['html', htmlPaths], ['markdown', markdownPaths]]) {
                await write('.env', dotenv(selection));
                await generate();
                assert.deepEqual(parseSitemap(await read('sitemap.xml')), paths.map(value => origin + value).sort());
                assert.equal(await read('llms.txt'), llms);
            }
            await write('.env', dotenv('both'));
            await generate();
            child = spawn(process.execPath, args('web:start'), {cwd: os.tmpdir(), env: {PATH: process.env.PATH}, stdio: ['ignore', 'pipe', 'pipe']});
            child.stdout.on('data', data => { output += data; });
            child.stderr.on('data', data => { output += data; });
            const request = (url, headers) => new Promise((resolve, reject) => {
                http.get(url, {headers}, res => {
                    let body = '';
                    res.setEncoding('utf8');
                    res.on('data', data => { body += data; });
                    res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body}));
                }).on('error', reject);
            });
            let ready = false;
            for (let attempt = 0; attempt < 100; attempt++) {
                if (child.exitCode !== null) throw new Error(`CLI exited: ${output}`);
                try { await request(origin + '/assets/ready.txt'); ready = true; break; } catch { await delay(50); }
            }
            assert.ok(ready, output);
            for (const url of urls) {
                const markdown = url.endsWith('.md');
                const res = await request(url, {accept: 'text/html', 'accept-language': 'ru', 'user-agent': 'Mozilla/5.0'});
                assert.equal(res.status, 200, `${url}: ${output}`);
                assert.equal(res.headers.location, undefined, url);
                assert.equal(res.headers['content-type'], `${markdown ? 'text/markdown' : 'text/html'}; charset=utf-8`, url);
                if (!markdown) {
                    assert.ok(res.body.includes(`rel="canonical" href="${url}"`), res.body);
                    for (const href of res.body.matchAll(/href="([^"]+)"/g)) {
                        if (!urls.includes(href[1])) {
                            // Non-indexable variants remain valid HTTP alternates, independently of discovery.
                            assert.ok([origin + `/en/${route('optout')}`, origin + `/${route('optout')}.md`].includes(href[1]), href[1]);
                            assert.equal((await request(href[1], {accept: 'text/html'})).status, 200);
                        }
                    }
                }
            }
            for (const url of llms.split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(2))) {
                assert.ok(urls.includes(url));
                const res = await request(url, {accept: 'text/html'});
                assert.equal(res.status, 200);
                assert.equal(res.headers['content-type'], 'text/markdown; charset=utf-8');
            }
            assert.match((await request(origin + `/${route('about')}.md`, {accept: 'text/html', 'accept-language': 'ru'})).body, /# en-about/);
            assert.match((await request(origin + `/ru/${route('about')}.md`, {accept: 'text/html'})).body, /# ru-about/);
            // Non-indexable remains public; discovery preference does not alter routing.
            assert.equal((await request(origin + `/en/${route('hidden')}.md`)).status, 200);
            assert.equal((await request(origin + (mode === 'site' ? '/en/raw.html' : '/en/raw/page.html'))).status, 404);
        } finally {
            if (child && child.exitCode === null) {
                const exited = once(child, 'exit');
                child.kill('SIGTERM');
                await exited;
            }
            await fs.rm(root, {recursive: true, force: true});
        }
    });
}
