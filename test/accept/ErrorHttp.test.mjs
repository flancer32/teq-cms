import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';

it('serves normal responses and localized errors through real CLI startup and HTTP', {timeout: 20000}, async () => {
    const project = path.resolve(import.meta.dirname, '../..');
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-error-http-'));
    let child;
    try {
        for (const name of ['src', 'bootstrap', 'package.json']) await fs.cp(path.join(project, name), path.join(root, name), {recursive: true});
        await fs.symlink(path.join(project, 'node_modules'), path.join(root, 'node_modules'));
        const write = async (file, content) => {
            const target = path.join(root, file);
            await fs.mkdir(path.dirname(target), {recursive: true});
            await fs.writeFile(target, content);
        };
        const reservation = http.createServer();
        reservation.listen(0, '127.0.0.1');
        await once(reservation, 'listening');
        const port = reservation.address().port;
        await new Promise((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
        await write('.env', `TEQ_CMS__BASE_URL=https://example.test\nTEQFW_TMPL__ALLOWED_LOCALES=en,ru\nTEQFW_TMPL__DEFAULT_LOCALE=en\nTEQFW_TMPL__ENGINE=nunjucks\nTEQFW_WEB__HOST=127.0.0.1\nTEQFW_WEB__PORT=${port}\n`);
        await write('tmpl/web/layout.html', '<html><body>{% block content %}{% endblock %}</body></html>');
        await write('tmpl/web/en/publication.html', '<main>{{ publication.html | safe }}</main>');
        await write('tmpl/web/en/about.md', '---\ntitle: About\ndescription: Test\ndate: 2026-09-30\n---\n# About\n');
        await write('tmpl/web/en/ordinary.html', '<h1>Ordinary</h1>');
        await write('web/assets/ok.txt', 'Static');
        await write('tmpl/web/en/broken.md', 'invalid');
        let output = '';
        child = spawn(process.execPath, [path.join(project, 'node_modules/@teqfw/cli/bin/teq.mjs'),
            '--host', '@flancer32/teq-cms', '--host-root', root, 'web:start'], {cwd: os.tmpdir(), env: {PATH: process.env.PATH}, stdio: ['ignore', 'pipe', 'pipe']});
        child.stdout.on('data', data => { output += data; });
        child.stderr.on('data', data => { output += data; });
        const request = (url, method = 'GET', headers = {}) => new Promise((resolve, reject) => {
            const req = http.request({hostname: '127.0.0.1', port, path: url, method, headers}, res => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', data => { body += data; });
                res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body}));
            });
            req.on('error', reject);
            req.end();
        });
        let ready = false;
        for (let attempt = 0; attempt < 100; attempt++) {
            if (child.exitCode !== null) throw new Error(`CLI exited: ${output}`);
            try { await request('/assets/ok.txt'); ready = true; break; } catch { await delay(50); }
        }
        assert.ok(ready, `CLI did not start: ${output}`);
        assert.equal((await request('/en/missing')).body, 'Not Found');
        for (const locale of ['en', 'ru']) await write(`tmpl/web/${locale}/404.html`,
            `{% extends "layout.html" %}{% block content %}<h1>${locale} missing</h1>{% if canonicalUrl or alternateUrls or markdownAlternateUrl or publication %}BAD_METADATA{% endif %}{% endblock %}`);

        for (const [url, match] of [['/en/about.html', /<h1>About/], ['/en/ordinary.html', /Ordinary/], ['/assets/ok.txt', /Static/]]) {
            const res = await request(url);
            assert.equal(res.status, 200, output);
            assert.match(res.body, match);
        }
        for (const [url, language] of [['/en/missing', 'en'], ['/ru/missing', 'ru'], ['/missing?token=SECRET', 'en'], ['/en/broken.html', 'en']]) {
            const res = await request(url, 'GET', {'accept-language': 'ru', accept: 'text/html'});
            assert.equal(res.status, 404);
            assert.match(res.body, new RegExp(`<h1>${language} missing</h1>`));
            assert.doesNotMatch(res.body, /SECRET|BAD_METADATA/);
            assert.equal(res.headers['cache-control'], 'no-store');
            assert.equal(res.headers['x-robots-tag'], 'noindex, follow');
            assert.equal(res.headers.location, undefined);
        }
        for (const url of ['/assets/missing.html', '/robots.txt', '/missing.md', '/agent/message', '/api/missing']) {
            const res = await request(url);
            assert.equal(res.status, 404);
            assert.doesNotMatch(res.body, /<html|<h1/);
        }
        const head = await request('/ru/missing', 'HEAD');
        assert.equal(head.status, 404);
        assert.equal(head.body, '');
        assert.equal(head.headers['content-type'], 'text/html; charset=utf-8');
        assert.ok(Number(head.headers['content-length']) > 0);
        await write('tmpl/web/en/404.html', '{% invalid syntax %}');
        assert.equal((await request('/en/missing')).body, 'Not Found');
        await write('tmpl/web/en/404.html', '');
        assert.equal((await request('/en/missing')).body, 'Not Found');
        await fs.rm(path.join(root, 'tmpl/web/en/404.html'));
        await fs.mkdir(path.join(root, 'tmpl/web/en/404.html'));
        assert.equal((await request('/en/missing')).body, 'Not Found');
        await fs.rm(path.join(root, 'tmpl/web/en/404.html'), {recursive: true});
        await fs.rm(path.join(root, 'tmpl/web/ru/404.html'));
        assert.equal((await request('/ru/missing')).body, 'Not Found');
    } finally {
        if (child && child.exitCode === null) {
            const exited = once(child, 'exit');
            child.kill('SIGTERM');
            await exited;
        }
        await fs.rm(root, {recursive: true, force: true});
    }
});
