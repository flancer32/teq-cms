// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Handler
 * @description Serves opted-in human and machine publication projections.
 * @implements TeqFw_Web_Back_Api_Handler
 */
export default class Fl32_Cms_Back_Publication_Handler {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Publication_Source} deps.source
     * @param {Fl32_Cms_Back_Publication_Catalog} deps.catalog
     * @param {Fl32_Tmpl_Back_Dto_Target} deps.dtoTarget
     * @param {Fl32_Tmpl_Back_Service_Render} deps.render
     * @param {TeqFw_Web_Back_Helper_Respond} deps.respond
     * @param {TeqFw_Web_Back_Dto_Info__Factory} deps.dtoInfo
     * @param {TeqFw_Web_Back_Enum_Stage} deps.STAGE
     * @param {TeqFw_Log_Provider} deps.logger
     * @param {typeof import('node:path')} deps.path
     */
    constructor({config, tmplConfig, source, catalog, dtoTarget, render, respond, dtoInfo, STAGE, logger, path}) {
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
        /** @type {string[]} */
        const machines = config.getPublicationMachineLocales();
        if (machines.some(locale => !locales.includes(locale))) {
            throw new Error('Publication machine locales must be maintained human locales.');
        }
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
            if (rawPath === config.getPublicationDiscoveryPath()) {
                try {
                    const base = config.getBaseUrl();
                    if (!base) throw new Error('BASE_URL is required for publication discovery.');
                    const lines = [
                        '# Published Markdown',
                        '',
                        `Human locales: ${locales.join(', ')}`,
                        `Machine-readable locales: ${machines.join(', ') || 'none'}`,
                        '',
                    ];
                    for (const locale of machines) {
                        /** @type {Fl32_Cms_Back_Publication_Item[]} */
                        const items = await catalog.list({locale});
                        for (const item of items) {
                            lines.push(`- ${new URL(`/${locale}/${item.route}.md`, base).href}`);
                        }
                    }
                    const body = `${lines.join('\n')}\n`;
                    respond.code200_Ok({res, headers: {'content-type': 'text/plain; charset=utf-8'}, body});
                    context.completed = true;
                } catch (error) {
                    log.error('Publication discovery failed.', {err: error});
                    fail();
                }
                return;
            }
            let decodedPath;
            try {
                decodedPath = decodeURIComponent(rawPath);
            } catch {
                fail();
                return;
            }
            const markdownPath = path.posix.normalize(decodedPath).replace(/\/+$/, '');
            if (markdownPath.endsWith('.md')) {
                const unscoped = markdownPath.slice(1);
                const scoped = unscoped.slice(unscoped.indexOf('/') + 1);
                const publicationPath = families.some(item =>
                    unscoped.startsWith(`${item.prefix}/`) || scoped.startsWith(`${item.prefix}/`));
                if (publicationPath && (rawPath !== decodedPath || decodedPath !== markdownPath ||
                    families.some(item => unscoped.startsWith(`${item.prefix}/`)))) {
                    fail();
                    return;
                }
            }
            const match = /^\/([^/]+)\/(.+)$/.exec(rawPath);
            if (!match) return;
            if (!locales.includes(match[1])) {
                if (families.some(item => match[2].startsWith(`${item.prefix}/`) && match[2].endsWith('.md'))) fail();
                return;
            }
            const locale = match[1];
            const rawRoute = match[2];
            const isMarkdown = rawRoute.endsWith('.md');
            const encodedRoute = isMarkdown ? rawRoute.slice(0, -3) : rawRoute;
            let route;
            try {
                route = decodeURIComponent(encodedRoute);
            } catch {
                fail();
                return;
            }
            const family = source.getFamily(route);
            if (!family) {
                if (isMarkdown && families.some(/** @param {Fl32_Cms_Back_Publication_Family} item */ item =>
                    encodedRoute.startsWith(`${item.prefix}/`))) fail();
                return;
            }
            if (route !== encodedRoute) {
                fail();
                return;
            }
            if (isMarkdown && !machines.includes(locale)) {
                fail();
                return;
            }
            try {
                const item = await source.read({locale, route});
                if (!item) {
                    fail();
                    return;
                }
                if (isMarkdown) {
                    respond.code200_Ok({
                        res,
                        headers: {'content-type': 'text/markdown; charset=utf-8'},
                        body: item.source,
                    });
                } else {
                    const base = config.getBaseUrl();
                    if (!base) throw new Error('BASE_URL is required for publication rendering.');
                    const target = dtoTarget.create({
                        type: 'web',
                        name: family.presentation,
                        locales: {user: locale, app: tmplConfig.getDefaultLocale()},
                    });
                    const alternateUrls = Object.fromEntries(locales.map(/** @param {string} value */ value =>
                        [value, new URL(`/${value}/${route}`, base).href]
                    ));
                    const data = {
                        publication: item,
                        locale,
                        allowedLocales: locales,
                        canonicalUrl: alternateUrls[locale],
                        alternateUrls,
                        markdownAlternateUrl: machines.includes(locale) ?
                            new URL(`/${locale}/${route}.md`, base).href : undefined,
                    };
                    const result = await render.perform({target, data, options: {}});
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
        dtoTarget: 'Fl32_Tmpl_Back_Dto_Target$',
        render: 'Fl32_Tmpl_Back_Service_Render$',
        respond: 'TeqFw_Web_Back_Helper_Respond$',
        dtoInfo: 'TeqFw_Web_Back_Dto_Info__Factory$',
        STAGE: 'TeqFw_Web_Back_Enum_Stage$',
        logger: 'TeqFw_Log_Provider$',
        path: 'node:path',
    }),
});
