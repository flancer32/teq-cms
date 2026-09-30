// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Handler
 * @description Serves publications with explicit or header-selected representations.
 * @see https://github.com/flancer32/teq-cms/blob/main/ctx/docs/architecture/publication.md
 * @implements TeqFw_Web_Back_Api_Handler
 */
export default class Fl32_Cms_Back_Publication_Handler {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Cms_Back_Publication_Routing} deps.routing
     * @param {Fl32_Cms_Back_Publication_Representation} deps.representation
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
    constructor({config, routing, representation, tmplConfig, source, catalog, render, respond, dtoInfo, STAGE, logger, path}) {
        const log = logger.forSource('Fl32_Cms_Back_Publication_Handler');
        const info = dtoInfo.create({
            name: 'Fl32_Cms_Back_Publication_Handler',
            stage: STAGE.PROCESS,
            before: ['Fl32_Cms_Back_Web_Handler_Template', 'TeqFw_Web_Back_Handler_Static'],
        });
        /** @type {Fl32_Cms_Back_Publication_Family[]} */
        const families = routing.getFamilies();
        /** @type {string[]} */
        const locales = tmplConfig.getAvailableLocales();
        if (families.length) {
            let base;
            try {
                base = new URL(config.getBaseUrl() ?? (routing.isSite() ? 'http://localhost' : ''));
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
            /** @type {Record<string, string>} */
            let representationHeaders = {};
            const rawPath = (req.url ?? '').split('?')[0];
            /** @returns {void} */
            const fail = () => {
                respond.code404_NotFound({res, headers: representationHeaders});
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
            if (routing.isEndpoint(decodedPath)) {
                if (rawPath !== decodedPath || !config.getAgentMessageEnabled()) fail();
                return;
            }
            if (routing.isStatic(decodedPath)) return;
            const home = routing.isSite() && (decodedPath === '/' || locales.some(value => decodedPath === `/${value}/` || decodedPath === `/${value}`));
            const normalized = home ? decodedPath : path.posix.normalize(decodedPath).replace(/\/+$/, '');
            if (!routing.isSite() && !ownsPath(decodedPath) && !ownsPath(normalized)) return;
            if (rawPath !== decodedPath || decodedPath !== normalized) {
                fail();
                return;
            }
            const unscoped = rawPath.slice(1);
            const neutral = routing.isSite() ? !locales.includes(unscoped.split('/')[0]) : ownsRoute(unscoped);
            const split = unscoped.indexOf('/');
            const requestedLocale = neutral ? undefined : split < 0 ? unscoped : unscoped.slice(0, split);
            const resource = neutral ? unscoped : split < 0 ? '' : unscoped.slice(split + 1);
            // Strip one supported representation suffix; Source still validates the logical route.
            const suffix = /\.(md|html)$/.exec(resource);
            const route = (suffix ? resource.slice(0, -suffix[0].length) : resource) || (home ? 'index' : '');
            // See ctx/docs/architecture/publication.md: source priority and format are separate.
            const selected = representation.select({suffix: suffix?.[1], headers: req.headers ?? {}});
            const html = selected === 'html';
            if (!suffix) representationHeaders = {vary: 'Accept, User-Agent'};
            const locale = neutral && suffix?.[1] === 'html' ? tmplConfig.getDefaultLocale() : requestedLocale;
            const family = source.getFamily(route);
            // Non-publication file types continue to ordinary delivery.
            if (!family && routing.isSite() && !suffix && /\.[A-Za-z0-9]+$/.test(resource)) return;
            if (!family) {
                fail();
                return;
            }
            try {
                if (routing.isSite() && !(await source.hasRoute({route}))) return;
                if (selected === null) {
                    res.writeHead(406, {...representationHeaders, 'content-type': 'text/plain; charset=utf-8'});
                    res.end('Not Acceptable');
                    context.completed = true;
                    return;
                }
                if ((locale !== undefined && !locales.includes(locale)) || (suffix?.[1] === 'html' && neutral && !locale)) {
                    fail();
                    return;
                }
                const item = locale === undefined ? await source.readNeutral({route}) : await source.readAvailable({locale, route});
                if (!item) {
                    fail();
                    return;
                }
                if (!html) {
                    respond.code200_Ok({
                        res,
                        headers: {...representationHeaders, 'content-type': 'text/markdown; charset=utf-8'},
                        body: item.source,
                    });
                } else {
                    const renderLocale = item.locale;
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
                        const alternate = value === renderLocale ? item : await source.readAvailable({locale: value, route});
                        if (alternate && (value === renderLocale || await catalog.getPresentation({item: alternate}))) {
                            alternateUrls[value] = new URL(routing.getUrl({locale: value, route}), base).href;
                        }
                    }
                    const markdown = await source.readNeutral({route});
                    const data = {
                        publication: item,
                        locale: renderLocale,
                        allowedLocales: locales,
                        canonicalUrl: new URL(routing.getUrl({locale: renderLocale, route}), base).href,
                        alternateUrls,
                        markdownAlternateUrl: markdown ? new URL(routing.getMarkdownUrl({route}), base).href : undefined,
                    };
                    const result = await render.perform({...presentation, data, options: {}});
                    if (result.resultCode !== 'SUCCESS' || typeof result.content !== 'string') {
                        throw new Error(`Publication presentation failed: ${result.resultCode}`);
                    }
                    respond.code200_Ok({
                        res,
                        headers: {...representationHeaders, 'content-type': 'text/html; charset=utf-8'},
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
        routing: 'Fl32_Cms_Back_Publication_Routing$',
        representation: 'Fl32_Cms_Back_Publication_Representation$',
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
