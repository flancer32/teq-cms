// @ts-check

/**
 * @namespace Fl32_Cms_Back_Di_Replace_Adapter
 * @description Default CMS web rendering adapter.
 *
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
    /**
     * @param {object} deps
     * @param {typeof import('node:path')} deps.path
     * @param {TeqFw_Log_Provider} deps.logger
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Tmpl_Back_Dto_Target} deps.dtoTmplTarget
     * @param {Fl32_Cms_Back_Helper_Web} deps.helpWeb
     * @param {Fl32_Cms_Back_Helper_File} deps.helpFile
     */
    constructor(
        {
            path,
            logger,
            tmplConfig,
            config,
            dtoTmplTarget,
            helpWeb,
            helpFile,
        }
    ) {
        const {join} = path;
        const log = logger.forSource('Fl32_Cms_Back_Di_Replace_Adapter');

        // MAIN
        /**
         * @param {object} deps
         * @param {object} deps.req
         * @returns {Promise<object>}
         */
        this.getRenderData = async function ({req}) {
            let target, data, options;
            try {
                const localeAllowed = tmplConfig.getAvailableLocales();
                const localeBaseWeb = tmplConfig.getDefaultLocale();
                const rawPath = decodeURIComponent(req.url?.split('?')[0] || '');
                const {cleanPath, locale} = helpWeb.extractRoutingInfo({
                    path: rawPath,
                    allowedLocales: localeAllowed,
                    fallbackLocale: localeBaseWeb,
                });
                const root = tmplConfig.getRootPath();
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
                log.error('Failed to build render data.', {err: e});
                target = data = options = undefined;
            }
            return {target, data, options};
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        path: 'node:path',
        logger: 'TeqFw_Log_Provider$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        config: 'Fl32_Cms_Back_Config$',
        dtoTmplTarget: 'Fl32_Tmpl_Back_Dto_Target$',
        helpWeb: 'Fl32_Cms_Back_Helper_Web$',
        helpFile: 'Fl32_Cms_Back_Helper_File$',
    }),
});
