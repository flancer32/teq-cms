/**
 * CMS helper for processing HTTP requests, handling locale extraction from URL paths and Accept-Language headers.
 */
export default class Fl32_Cms_Back_Helper_Web {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:http2')} http2
     * @param {Fl32_Cms_Back_Config} config
     */
    constructor(
        {
            'node:http2': http2,
            Fl32_Cms_Back_Config$: config,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        // VARS
        const {constants: H2} = http2;
        const {HTTP2_HEADER_ACCEPT_LANGUAGE} = H2;

        /**
         * Parses Accept-Language header into a prioritized language list.
         * @param {string} header
         * @returns {Array<{lang: string, q: number}>}
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
         * @param {string} header
         * @returns {string}
         */
        function resolveFromAcceptLanguage(header) {
            const allowed = config.getAllowedLocales();
            const accepted = parseAcceptLanguage(header);
            for (const lang of accepted) {
                if (allowed.includes(lang)) return lang;
                const short = lang.split('-')[0];
                if (allowed.includes(short)) return short;
            }
            return config.getDefaultLocale;
        }

        /**
         * Extracts locale code from the URL path if present.
         * @param {string} path
         * @returns {string|null}
         */
        function extractFromUrlPath(path) {
            const trimmed = path.replace(/^\/+|\/+$/g, '');
            const first = trimmed.split('/')[0];
            if (config.getAllowedLocales().includes(first)) return first;
            return null;
        }

        // MAIN
        /**
         * Extracts locale from request URL or Accept-Language header.
         * @param {import('node:http').IncomingMessage | import('node:http2').Http2ServerRequest} req
         * @returns {string}
         */
        this.extractLocale = function ({req}) {
            const urlPath = decodeURIComponent(req.url?.split('?')[0] || '');
            const fromUrl = extractFromUrlPath(urlPath);
            if (fromUrl) return fromUrl;
            return resolveFromAcceptLanguage(req.headers[HTTP2_HEADER_ACCEPT_LANGUAGE]);
        };
    }
}