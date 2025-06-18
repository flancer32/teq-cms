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
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Tmpl_Back_Dto_Target} dtoTmplTarget
     * @param {Fl32_Cms_Back_Helper_Web} helpWeb
     * @param {Fl32_Cms_Back_Helper_File} helpFile
     */
    constructor(
        {
            'node:fs': fs,
            'node:path': path,
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
            Fl32_Tmpl_Back_Dto_Target$: dtoTmplTarget,
            Fl32_Cms_Back_Helper_Web$: helpWeb,
            Fl32_Cms_Back_Helper_File$: helpFile,
        }
    ) {
        const {join} = path;

        // MAIN

        this.getRenderData = async function ({req}) {
            let target, data, options;
            try {
                const localeAllowed = config.getLocaleAllowed();
                const localeBaseWeb = config.getLocaleBaseWeb();
                const rawPath = decodeURIComponent(req.url?.split('?')[0] || '');
                const {cleanPath, locale} = helpWeb.extractRoutingInfo({
                    path: rawPath,
                    allowedLocales: localeAllowed,
                    fallbackLocale: localeBaseWeb,
                });
                const root = config.getRootPath();
                const baseDir = join(root, 'tmpl', 'web', localeBaseWeb);
                const tmplPath = await helpFile.resolveTemplateName({
                    baseDir,
                    cleanPath,
                });
                if (tmplPath) {

                    target = dtoTmplTarget.create({
                        type: 'web',
                        name: tmplPath,
                        locales: {
                            user: locale,
                            app: localeBaseWeb,
                        },
                    });

                    const rawBaseUrl = config.getBaseUrl();
                    const baseUrl = (rawBaseUrl || `//${req.headers.host || 'localhost'}`).replace(/\/+$/, '');

                    const canonicalUrl = `${baseUrl}/${localeBaseWeb}/${tmplPath}`;
                    const alternateUrls = {};
                    for (const loc of localeAllowed) {
                        alternateUrls[loc] = `${baseUrl}/${loc}/${tmplPath}`;
                    }

                    data = {
                        ip: req.socket?.remoteAddress || '',
                        ua: req.headers['user-agent'] || '',
                        lang: req.headers['accept-language'] || '',
                        locale,
                        allowedLocales: localeAllowed,
                        canonicalUrl,
                        alternateUrls,
                    };

                    options = {};
                }
            } catch (e) {
                logger.error(e);
                target = data = options = undefined;
            }
            return {target, data, options};
        };
    }
}
