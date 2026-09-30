import Web from '../../../../src/Back/Helper/Web.mjs';
import http2 from 'node:http2';
import {describe, it} from 'node:test';
import assert from 'assert';
import {buildTestContainer} from '../../../support/unit.js';

describe('Fl32_Cms_Back_Helper_Web.extractRoutingInfo', () => {
    const container = buildTestContainer();

    container.register('node:http2', {
        constants: {HTTP2_HEADER_ACCEPT_LANGUAGE: 'accept-language'},
    });

    container.register('TeqFw_Cfg_Reader$', {
        get: () => ({ALLOWED_LOCALES: ['en', 'ru'], DEFAULT_LOCALE: 'en', ROOT_PATH: '/root'}),
    });

    it('should extract locale from first segment', async () => {
        const helpWeb = await container.get('Fl32_Cms_Back_Helper_Web$');
        const res = helpWeb.extractRoutingInfo({
            path: '/ru/path/to',
            allowedLocales: ['en', 'ru'],
            fallbackLocale: 'en',
        });
        assert.deepStrictEqual(res, {locale: 'ru', cleanPath: '/path/to'});
    });

    it('should use fallback when no locale in path', async () => {
        const helpWeb = await container.get('Fl32_Cms_Back_Helper_Web$');
        const res = helpWeb.extractRoutingInfo({
            path: '/about.html',
            allowedLocales: ['en', 'ru'],
            fallbackLocale: 'en',
        });
        assert.deepStrictEqual(res, {locale: 'en', cleanPath: '/about.html'});
    });

    it('should handle empty path', async () => {
        const helpWeb = await container.get('Fl32_Cms_Back_Helper_Web$');
        const res = helpWeb.extractRoutingInfo({
            path: '',
            allowedLocales: ['en', 'ru'],
            fallbackLocale: 'en',
        });
        assert.deepStrictEqual(res, {locale: 'en', cleanPath: ''});
    });
});


it('resolves HTML language by URL, weighted header, regional match and configured default', () => {
    const helper = new Web({http2, tmplConfig: {
        getAvailableLocales: () => ['en', 'ru', 'en-GB'], getDefaultLocale: () => 'ru',
    }});
    for (const [url, header, expected] of [
        ['/en/about', 'ru', 'en'], ['/ru/', 'en', 'ru'],
        ['/about.html', 'en', 'en'], ['/', 'ru;q=0.2,en;q=0.8', 'en'],
        ['/', 'EN-gb,en;q=0.5', 'en-GB'], ['/', 'en-US', 'en'],
        ['/', 'en;q=0,ru;q=0.5', 'ru'], ['/', 'ru;q=0.8,en;q=0.8', 'ru'],
        ['/', 'en;q=2,ru;q=0.5', 'ru'], ['/', 'en;q=bad', 'ru'],
        ['/', '*', 'ru'], ['/', 'fr', 'ru'], ['/', '', 'ru'],
    ]) {
        assert.equal(helper.extractLocale({req: {url, headers: {'accept-language': header}}}), expected);
    }
});
