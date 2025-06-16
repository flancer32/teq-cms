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
export default class Fl32_Cms_Back_Di_Replace_Adapter {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:fs')} fs
     * @param {typeof import('node:path')} path
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Tmpl_Back_Dto_Target} dtoTmplTarget
     */
    constructor(
        {
            'node:fs': fs,
            'node:path': path,
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

        const {promises, constants} = fs;
        const {access} = promises;
        const {join, extname} = path;

        async function resolveTemplateName(baseDir, cleanPath) {
            const trimmed = cleanPath.replace(/^\/+|\/+$/g, '');
            const ext = extname(trimmed);

            if (ext && ext !== '.html') return trimmed;

            if (ext === '.html') {
                try {
                    await access(join(baseDir, trimmed), constants.R_OK);
                    return trimmed;
                } catch {
                    return undefined;
                }
            }

            const first = trimmed ? join(trimmed, 'index.html') : 'index.html';
            const second = trimmed ? `${trimmed}.html` : 'index.html';

            try {
                await access(join(baseDir, first), constants.R_OK);
                return first;
            } catch {}

            try {
                await access(join(baseDir, second), constants.R_OK);
                return second;
            } catch {}

            return undefined;
        }

        // MAIN

        this.getRenderData = async function ({req}) {
            let target, data, options;
            try {
                const localeAllowed = config.getLocaleAllowed();
                const localeBaseWeb = config.getLocaleBaseWeb();
                const rawPath = decodeURIComponent(req.url?.split('?')[0] || '');
                const {cleanPath, locale} = extractLocaleFromUrl(rawPath, localeAllowed, localeBaseWeb);
                const root = config.getRootPath();
                const baseDir = join(root, 'tmpl', 'web', localeBaseWeb);
                const tmplPath = await resolveTemplateName(baseDir, cleanPath);
                if (tmplPath) {

                    target = dtoTmplTarget.create({
                        type: 'web',
                        name: tmplPath,
                        locales: {
                            user: locale,
                            app: localeBaseWeb,
                        },
                    });

                    data = {
                        ip: req.socket?.remoteAddress || '',
                        ua: req.headers['user-agent'] || '',
                        lang: req.headers['accept-language'] || '',
                        locale,
                        lang1: localeAllowed[0] || '',
                        lang2: localeAllowed[1] || '',
                        lang3: localeAllowed[2] || '',
                    };

                    options = {};
                }
            } catch {
                target = data = options = undefined;
            }
            return {target, data, options};
        };
    }
}
