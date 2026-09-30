// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Handler
 * @description Serves localized HTML projections and canonical neutral Markdown resources.
 * @implements TeqFw_Web_Back_Api_Handler
 */
export default class Fl32_Cms_Back_Publication_Handler {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Publication_Source} deps.source
     * @param {Fl32_Cms_Back_Publication_Catalog} deps.catalog
     * @param {Fl32_Tmpl_Back_Service_Render} deps.render
     * @param {TeqFw_Web_Back_Helper_Respond} deps.respond
     * @param {TeqFw_Web_Back_Dto_Info__Factory} deps.dtoInfo
     * @param {TeqFw_Web_Back_Enum_Stage} deps.STAGE
     * @param {TeqFw_Log_Provider} deps.logger
     * @param {typeof import('node:path')} deps.path
     */
    constructor({config, tmplConfig, source, catalog, render, respond, dtoInfo, STAGE, logger, path}) {
        const log = logger.forSource('Fl32_Cms_Back_Publication_Handler');
        const info = dtoInfo.create({
            name: 'Fl32_Cms_Back_Publication_Handler',
            stage: STAGE.PROCESS,
            before: ['Fl32_Cms_Back_Web_Handler_Template', 'TeqFw_Web_Back_Handler_Static'],
        });
        /** @type {Fl32_Cms_Back_Publication_Family[]} */
        const families = config.getPublicationFamilies();
        /** @type {string[]} */
        const locales = tmplConfig.getAvailableLocales();
        if (families.length) {
            let base;
            try {
                base = new URL(config.getBaseUrl() ?? '');
            } catch {
                throw new Error('Publication requires an absolute BASE_URL without a path.');
            }
            if (!['http:', 'https:'].includes(base.protocol) || base.pathname !== '/' ||
                base.search || base.hash || base.username || base.password) {
                throw new Error('Publication requires an absolute BASE_URL without a path.');
            }
        }

        /** @returns {object} */
        this.getRegistrationInfo = () => info;

        /** @param {TeqFw_Web_Back_Pipeline_RequestContext} context @returns {Promise<void>} */
        this.handle = async context => {
            if (!families.length || !respond.isWritable(context.response)) return;
            const {request: req, response: res} = context;
            const rawPath = (req.url ?? '').split('?')[0];
            /** @returns {void} */
            const fail = () => {
                respond.code404_NotFound({res});
                context.completed = true;
            };
            let decodedPath;
            try {
                decodedPath = decodeURIComponent(rawPath);
            } catch {
                fail();
                return;
            }
            // Recognize reserved family paths before rejecting noncanonical spellings.
            /** @param {string} value @returns {boolean} */
            const ownsRoute = value => families.some(item => value.startsWith(`${item.prefix}/`));
            /** @param {string} value @returns {boolean} */
            const ownsPath = value => {
                const unscoped = value.slice(1);
                const scoped = unscoped.slice(unscoped.indexOf('/') + 1);
                return ownsRoute(unscoped) || ownsRoute(scoped);
            };
            const normalized = path.posix.normalize(decodedPath).replace(/\/+$/, '');
            if (!ownsPath(decodedPath) && !ownsPath(normalized)) return;
            if (rawPath !== decodedPath || decodedPath !== normalized) {
                fail();
                return;
            }
            const unscoped = rawPath.slice(1);
            const neutral = ownsRoute(unscoped);
            const split = unscoped.indexOf('/');
            const locale = neutral ? undefined : unscoped.slice(0, split);
            const route = neutral ? unscoped : unscoped.slice(split + 1);
            const family = source.getFamily(route);
            if (!family || (locale !== undefined && !locales.includes(locale))) {
                fail();
                return;
            }
            try {
                const item = locale === undefined ? await source.readNeutral({route}) : await source.readAvailable({locale, route});
                if (!item) {
                    fail();
                    return;
                }
                if (neutral) {
                    respond.code200_Ok({
                        res,
                        headers: {'content-type': 'text/markdown; charset=utf-8'},
                        body: item.source,
                    });
                } else {
                    const base = config.getBaseUrl();
                    if (!base) throw new Error('BASE_URL is required for publication rendering.');
                    const presentation = await catalog.getPresentation({item});
                    if (!presentation) {
                        fail();
                        return;
                    }
                    /** @type {Record<string, string>} */
                    const alternateUrls = {};
                    for (const value of locales) {
                        const alternate = value === locale ? item : await source.readAvailable({locale: value, route});
                        if (alternate && (value === locale || await catalog.getPresentation({item: alternate}))) {
                            alternateUrls[value] = new URL(`/${value}/${route}`, base).href;
                        }
                    }
                    const markdown = await source.readNeutral({route});
                    const data = {
                        publication: item,
                        locale,
                        allowedLocales: locales,
                        canonicalUrl: new URL(`/${locale}/${route}`, base).href,
                        alternateUrls,
                        markdownAlternateUrl: markdown ? new URL(`/${route}`, base).href : undefined,
                    };
                    const result = await render.perform({...presentation, data, options: {}});
                    if (result.resultCode !== 'SUCCESS' || typeof result.content !== 'string') {
                        throw new Error(`Publication presentation failed: ${result.resultCode}`);
                    }
                    respond.code200_Ok({
                        res,
                        headers: {'content-type': 'text/html; charset=utf-8'},
                        body: result.content,
                    });
                }
                context.completed = true;
            } catch (error) {
                log.error('Publication request failed.', {err: error});
                fail();
            }
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        config: 'Fl32_Cms_Back_Config$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        source: 'Fl32_Cms_Back_Publication_Source$',
        catalog: 'Fl32_Cms_Back_Publication_Catalog$',
        render: 'Fl32_Tmpl_Back_Service_Render$',
        respond: 'TeqFw_Web_Back_Helper_Respond$',
        dtoInfo: 'TeqFw_Web_Back_Dto_Info__Factory$',
        STAGE: 'TeqFw_Web_Back_Enum_Stage$',
        logger: 'TeqFw_Log_Provider$',
        path: 'node:path',
    }),
});
