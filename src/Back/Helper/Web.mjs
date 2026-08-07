// @ts-check

/**
 * @namespace Fl32_Cms_Back_Helper_Web
 * @description HTTP locale and routing helper.
 *
 * CMS helper for processing HTTP requests, handling locale extraction from URL paths and Accept-Language headers.
 */
export default class Fl32_Cms_Back_Helper_Web {
    /**
     * @param {object} deps
     * @param {typeof import('node:http2')} deps.http2
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     */
    constructor(
        {
            http2,
            tmplConfig,
        }
    ) {
        // VARS
        const {constants: H2} = http2;
        const {HTTP2_HEADER_ACCEPT_LANGUAGE} = H2;

        /**
         * Parses Accept-Language header into a prioritized language list.
         * @param {string} header - Raw value of the Accept-Language header, e.g. "en-US,en;q=0.9,ru;q=0.8".
         * @returns {string[]} Language codes sorted by descending quality factor.
         */
        function parseAcceptLanguage(header) {
            if (!header) return [];
            return header
                .split(',')
                .map(part => {
                    const [lang, q] = part.trim().split(';q=');
                    return {lang, q: parseFloat(q) || 1.0};
                })
                .sort((a, b) => b.q - a.q)
                .map(entry => entry.lang);
        }

        /**
         * Resolves preferred locale from Accept-Language header against allowed locales.
         * @param {string} header - Raw Accept-Language header value, e.g. "en-US,en;q=0.9,fr;q=0.8".
         * @returns {string} - Resolved locale code (e.g. "en", "ru", etc.).
         */
        function resolveFromAcceptLanguage(header) {
            const allowed = tmplConfig.getAvailableLocales();
            const accepted = parseAcceptLanguage(header);
            for (const lang of accepted) {
                if (allowed.includes(lang)) return lang;
                const short = lang.split('-')[0];
                if (allowed.includes(short)) return short;
            }
            return tmplConfig.getDefaultLocale();
        }

        /**
         * Extracts locale code from the URL path if present.
         * @param {string} path - Raw URL path (e.g. "/en/about" or "/ru/blog/2024").
         * @returns {string|null} - Extracted locale code if present in the path; otherwise, null.
         */
        function extractFromUrlPath(path) {
            const trimmed = path.replace(/^\/+|\/+$/g, '');
            const first = trimmed.split('/')[0];
            if (tmplConfig.getAvailableLocales().includes(first)) return first;
            return null;
        }

        // MAIN
        /**
         * Extracts locale from request URL or Accept-Language header.
         * @param {object} deps
         * @param {object} deps.req - HTTP request object containing URL and headers.
         * @returns {string}
         */
        this.extractLocale = function ({req}) {
            const urlPath = decodeURIComponent(req.url?.split('?')[0] || '');
            const fromUrl = extractFromUrlPath(urlPath);
            if (fromUrl) return fromUrl;
            return resolveFromAcceptLanguage(req.headers[HTTP2_HEADER_ACCEPT_LANGUAGE]);
        };

        /**
         * Extracts locale and clean path from a URL path string.
         *
         * @param {object} deps - Parameters object.
         * @param {string} deps.path - Raw URL path
         * @param {string[]} deps.allowedLocales - List of supported locales
         * @param {string} deps.fallbackLocale - Locale used when none found in path
         * @returns {object}
         */
        this.extractRoutingInfo = function ({path, allowedLocales, fallbackLocale}) {
            const trimmed = (path ?? '').replace(/^\/+|\/+$/g, '');
            const segments = trimmed.split('/');
            const first = segments[0];

            if (allowedLocales.includes(first)) {
                return {
                    locale: first,
                    cleanPath: '/' + segments.slice(1).join('/'),
                };
            }

            return {
                locale: fallbackLocale,
                cleanPath: path ?? '',
            };
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        http2: 'node:http2',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
    }),
});
