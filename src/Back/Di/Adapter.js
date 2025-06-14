/**
 * Default CMS backend adapter for web rendering.
 *
 * Implements locale-aware template resolution for HTTP requests in TeqCMS.
 * Extracts the user locale from the first URL segment and builds the template path
 * based on the remaining segments. Falls back to the base locale if no match is found.
 *
 * Returns a render target DTO (`Fl32_Tmpl_Back_Dto_Target.Dto`) with a resolved path and locales,
 * along with request metadata and rendering options.
 *
 * @implements Fl32_Cms_Back_Api_Adapter
 */
export default class Fl32_Cms_Back_Di_Adapter {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Tmpl_Back_Dto_Target} dtoTmplTarget
     */
    constructor(
        {
            Fl32_Cms_Back_Config$: config,
            Fl32_Tmpl_Back_Dto_Target$: dtoTmplTarget,
        }
    ) {
        // FUNCS

        function extractLocaleFromUrl(urlPath, allowed, fallback) {
            const trimmed = urlPath.replace(/^\/+|\/+$/g, '');
            const segments = trimmed.split('/');
            const first = segments[0];

            if (allowed.includes(first)) {
                return {
                    locale: first,
                    cleanPath: '/' + segments.slice(1).join('/'),
                };
            } else {
                return {
                    locale: fallback,
                    cleanPath: urlPath,
                };
            }
        }

        function buildTemplatePath(cleanPath) {
            const trimmed = cleanPath.replace(/^\/+|\/+$/g, '');
            if (trimmed === '') return 'index.html';
            if (cleanPath.endsWith('/')) return `${trimmed}/index.html`;
            return trimmed;
        }

        // MAIN

        this.getRenderData = async function ({req}) {
            let target, data, options;
            try {
                const localeAllowed = config.getLocaleAllowed();
                const localeBaseWeb = config.getLocaleBaseWeb();
                const rawPath = decodeURIComponent(req.url?.split('?')[0] || '');
                const {cleanPath, locale} = extractLocaleFromUrl(rawPath, localeAllowed, localeBaseWeb);
                const tmplPath = buildTemplatePath(cleanPath);

                target = dtoTmplTarget.create({
                    type: 'web',
                    name: tmplPath,
                    locales: {
                        user: locale,
                        app: localeBaseWeb,
                    },
                });

                data = {
                    client: {
                        ip: req.socket?.remoteAddress || '',
                        ua: req.headers['user-agent'] || '',
                        lang: req.headers['accept-language'] || '',
                    },
                    locale,
                    localeAllowed,
                };

                options = {};
            } catch {
                target = data = options = undefined;
            }
            return {target, data, options};
        };
    }
}
