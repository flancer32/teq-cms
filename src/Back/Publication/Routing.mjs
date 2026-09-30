// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Routing
 * @description Validates host routing policy and maps publication identities to URLs.
 */
export default class Routing {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Publication_Policy} deps.policy
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     */
    constructor({policy, config, tmplConfig}) {
        const mode = policy.getMode();
        if (!['site', 'families'].includes(mode)) throw new Error('Invalid publication policy mode.');
        const families = config.getPublicationFamilies();
        if (mode === 'site' && families.length) throw new Error('Site policy cannot be combined with PUBLICATION_FAMILIES.');
        const suppliedPrefixes = policy.getStaticPrefixes();
        const prefixes = Array.isArray(suppliedPrefixes) ? [...suppliedPrefixes] : suppliedPrefixes;
        if (!Array.isArray(prefixes) || prefixes.some(value =>
            typeof value !== 'string' || !/^\/(?:[A-Za-z0-9_-]+\/)+$/.test(value))) {
            throw new Error('Static prefixes must be absolute safe paths ending in a slash.');
        }
        /** @returns {boolean} */
        this.isSite = () => mode === 'site';
        /** @param {string} urlPath @returns {boolean} */
        this.isStatic = urlPath => ['/robots.txt', '/llms.txt', '/sitemap.xml'].includes(urlPath) ||
            prefixes.some(prefix => urlPath === prefix.slice(0, -1) || urlPath.startsWith(prefix));
        /** @param {string} urlPath @returns {boolean} */
        this.isEndpoint = urlPath => urlPath === '/agent/message';
        /** @param {string} route @returns {boolean} */
        this.isPublicRoute = route => /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(route) &&
            !this.isStatic(`/${route}`) && !this.isEndpoint(`/${route}`) &&
            (mode !== 'site' || !tmplConfig.getAvailableLocales().includes(route.split('/')[0]));
        /** @returns {Fl32_Cms_Back_Publication_Family[]} */
        this.getFamilies = () => mode === 'site' ? [{prefix: '', presentation: 'publication.html'}] : families;
        /**
         * Stable Markdown address; headers cannot change its representation.
         * @param {object} deps
         * @param {string} deps.route
         * @param {string} [deps.locale]
         * @returns {string}
         */
        this.getMarkdownUrl = ({route, locale}) => locale ? `/${locale}/${route}.md` : `/${route}.md`;
        /**
         * @param {object} deps
         * @param {string} deps.route
         * @param {string} [deps.locale]
         * @returns {string}
         */
        this.getUrl = ({route, locale}) => {
            const resource = mode === 'site' && route === 'index' ? '' : route;
            return locale ? `/${locale}/${resource}` : `/${resource}`;
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        policy: 'Fl32_Cms_Back_Publication_Policy$',
        config: 'Fl32_Cms_Back_Config$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
    }),
});
