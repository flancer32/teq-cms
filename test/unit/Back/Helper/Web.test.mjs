import {describe, it} from 'node:test';
import assert from 'assert';
import {buildTestContainer} from '../../common.js';

describe('Fl32_Cms_Back_Helper_Web.extractRoutingInfo', () => {
    const container = buildTestContainer();

    container.register('node:http2', {
        constants: {HTTP2_HEADER_ACCEPT_LANGUAGE: 'accept-language'},
    });

    container.register('Fl32_Cms_Back_Config$', {
        getLocaleAllowed: () => ['en', 'ru'],
        getLocaleBaseWeb: () => 'en',
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
