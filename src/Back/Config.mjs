// @ts-check

/**
 * @namespace Fl32_Cms_Back_Config
 * @description Typed CMS configuration projected from TeqFW cfg.
 */
export default class Fl32_Cms_Back_Config {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Helper_Cast} deps.cast
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {TeqFw_Cfg_Reader} deps.reader
     */
    constructor({cast, reader, tmplConfig}) {
        const raw = reader.get('TEQ_CMS');

        const baseUrl = cast.string(raw.BASE_URL);
        const sitemapRepresentations = raw.SITEMAP_REPRESENTATIONS ?? 'html';
        if (!['html', 'markdown', 'both'].includes(sitemapRepresentations)) {
            throw new Error('SITEMAP_REPRESENTATIONS must be html, markdown, or both.');
        }
        const agentMessageEnabled = cast.bool(raw.AGENT_MESSAGE_ENABLED) ?? false;
        const agentMessageToken = cast.string(raw.AGENT_MESSAGE_TOKEN);
        const familiesInput = raw.PUBLICATION_FAMILIES ?? [];
        const families = typeof familiesInput === 'string' ? JSON.parse(familiesInput) : familiesInput;
        if (!Array.isArray(families)) throw new Error('PUBLICATION_FAMILIES must be an array.');
        /** @param {unknown} value @returns {boolean} */
        const validPath = value => typeof value === 'string' &&
            /^(?:[a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_-]+)*$/.test(value);
        const publicationFamilies = families.map(family => {
            if (!family || !validPath(family.prefix) ||
                typeof family.presentation !== 'string' ||
                !family.presentation.endsWith('.html') ||
                !validPath(family.presentation.slice(0, -5))) {
                throw new Error('Invalid publication family: expected safe prefix and presentation template.');
            }
            return Object.freeze({prefix: family.prefix, presentation: family.presentation});
        });
        const prefixes = publicationFamilies.map(family => family.prefix);
        if (new Set(prefixes).size !== prefixes.length ||
            prefixes.some(prefix => prefixes.some(other => other !== prefix && prefix.startsWith(`${other}/`)))) {
            throw new Error('Publication family prefixes must be unique and non-overlapping.');
        }
        if (prefixes.some(prefix => tmplConfig.getAvailableLocales().includes(prefix.split('/')[0]))) {
            throw new Error('Publication prefixes must not begin with a maintained locale.');
        }
        /** @returns {string|undefined} Canonical CMS base URL. */
        this.getBaseUrl = () => baseUrl;
        /** @returns {'html'|'markdown'|'both'} Formats included in the sitemap. */
        this.getSitemapRepresentations = () => /** @type {'html'|'markdown'|'both'} */ (sitemapRepresentations);
        /** @returns {boolean} Whether the agent message route is registered. */
        this.getAgentMessageEnabled = () => agentMessageEnabled;
        /** @returns {string|undefined} Optional shared token for agent messages. */
        this.getAgentMessageToken = () => agentMessageToken;
        /** @returns {Fl32_Cms_Back_Publication_Family[]} */
        this.getPublicationFamilies = () => publicationFamilies;
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        cast: 'Fl32_Cms_Back_Helper_Cast$',
        reader: 'TeqFw_Cfg_Reader$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
    }),
});
