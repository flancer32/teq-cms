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
                .map((part, index) => {
                    const [lang, ...parameters] = part.trim().split(';');
                    const weight = parameters.find(value => /^\s*q\s*=/i.test(value));
                    const raw = weight?.split('=')[1]?.trim();
                    const q = raw === undefined ? 1 : /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(raw) ? Number(raw) : 0;
                    return {lang: lang.toLowerCase(), q, index};
                })
                .filter(entry => entry.q > 0)
                .sort((a, b) => b.q - a.q || a.index - b.index)
                .map(entry => entry.lang);
        }

        /**
         * Resolves preferred locale from Accept-Language header against allowed locales.
         * @param {string} header - Raw Accept-Language header value, e.g. "en-US,en;q=0.9,fr;q=0.8".
         * @returns {string} - Resolved locale code (e.g. "en", "ru", etc.).
         */
        function resolveFromAcceptLanguage(header) {
            /** @type {string[]} */
            const allowed = tmplConfig.getAvailableLocales();
            const accepted = parseAcceptLanguage(header);
            for (const lang of accepted) {
                const exact = allowed.find(value => value.toLowerCase() === lang);
                if (exact) return exact;
                const short = lang.split('-')[0];
                const base = allowed.find(value => value.toLowerCase() === short);
                if (base) return base;
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
         * @param {Fl32_Cms_Back_Di_Replace_Adapter_Request} deps.req - HTTP request object containing URL and headers.
         * @returns {string}
         */
        this.extractLocale = function ({req}) {
            const urlPath = decodeURIComponent(req.url?.split('?')[0] || '');
            const fromUrl = extractFromUrlPath(urlPath);
            if (fromUrl) return fromUrl;
            return resolveFromAcceptLanguage(req.headers[HTTP2_HEADER_ACCEPT_LANGUAGE] || '');
        };

        /**
         * Extracts locale and clean path from a URL path string.
         *
         * @param {object} deps - Parameters object.
         * @param {string} deps.path - Raw URL path
         * @param {string[]} deps.allowedLocales - List of supported locales
         * @param {string} deps.fallbackLocale - Locale used when none found in path
         * @returns {Fl32_Cms_Back_Helper_Web_RoutingInfo}
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
