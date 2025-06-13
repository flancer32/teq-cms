import http from 'node:http';
import http2 from 'node:http2';
import path from 'node:path';
import fs from 'node:fs/promises';
import {existsSync, createReadStream} from 'node:fs';
import nunjucks from 'nunjucks';
import dotenv from 'dotenv';
import Fl32_Cms_Back_Helper_Web from './src/Back/Helper/Web.js';

dotenv.config();

const ROOT = path.resolve(process.cwd());
const PORT = process.env.PORT || 3000;
const ALLOWED = (process.env.LOCALE_ALLOWED || 'en,es,ru').split(',');
const DEFAULT_LOCALE = process.env.LOCALE_BASE || 'en';

const configStub = {
  getLocaleAllowed: () => ALLOWED,
  getLocaleBaseWeb: () => DEFAULT_LOCALE,
};

const helpWeb = new Fl32_Cms_Back_Helper_Web({
  'node:http2': http2,
  Fl32_Cms_Back_Config$: configStub,
});

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css',
    '.ico': 'image/x-icon',
    '.html': 'text/html',
  }[ext] || 'application/octet-stream';
}

async function serveStatic(res, filePath) {
  const stream = createReadStream(filePath);
  res.writeHead(200, {'Content-Type': mimeType(filePath)});
  stream.pipe(res);
}

async function renderTemplate(res, locale, relPath) {
  const paths = [
    path.join(ROOT, 'tmpl', 'web', locale),
    path.join(ROOT, 'tmpl', 'web', DEFAULT_LOCALE),
  ];
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(paths, {noCache: true}));
  try {
    const html = env.render(relPath, {locale, title: 'TeqCMS Demo'});
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(html);
  } catch (e) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const locale = helpWeb.extractLocale({req});
  let urlPath = decodeURIComponent(req.url.split('?')[0] || '/');

  const hasLocale = ALLOWED.some(loc => urlPath === `/${loc}` || urlPath.startsWith(`/${loc}/`));
  if (!hasLocale) {
    const newUrl = `/${locale}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
    res.writeHead(302, {Location: newUrl});
    res.end();
    return;
  }

  let relPath = urlPath.replace(/^\/+/, '');
  for (const loc of ALLOWED) {
    if (relPath === loc) { relPath = ''; break; }
    if (relPath.startsWith(`${loc}/`)) { relPath = relPath.slice(loc.length + 1); break; }
  }
  if (relPath === '' || relPath.endsWith('/')) relPath += 'index.html';

  const staticPath = path.join(ROOT, 'web', relPath);
  if (existsSync(staticPath)) {
    await serveStatic(res, staticPath);
    return;
  }
  await renderTemplate(res, locale, relPath);
});

server.listen(PORT, () => {
  console.log(`Demo server listening on http://localhost:${PORT}/`);
});
