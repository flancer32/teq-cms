// @ts-check

/**
 * @namespace Fl32_Cms_Back_Config
 * @description Typed CMS configuration projected from TeqFW cfg.
 */
export default class Fl32_Cms_Back_Config {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Helper_Cast} deps.cast
     * @param {TeqFw_Cfg_Reader} deps.reader
     */
    constructor({cast, reader}) {
        const raw = reader.get('TEQ_CMS');

        const baseUrl = cast.string(raw.BASE_URL);
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
        const machineInput = raw.PUBLICATION_MACHINE_LOCALES ?? [];
        const machineLocales = Array.isArray(machineInput) ? machineInput :
            typeof machineInput === 'string' ? machineInput.split(',').map(value => value.trim()).filter(Boolean) : [];
        if (!machineLocales.every(value => typeof value === 'string' &&
            /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(value)) ||
            new Set(machineLocales).size !== machineLocales.length) {
            throw new Error('Invalid PUBLICATION_MACHINE_LOCALES.');
        }

        /** @returns {string|undefined} Canonical CMS base URL. */
        this.getBaseUrl = () => baseUrl;
        /** @returns {boolean} Whether the agent message route is registered. */
        this.getAgentMessageEnabled = () => agentMessageEnabled;
        /** @returns {string|undefined} Optional shared token for agent messages. */
        this.getAgentMessageToken = () => agentMessageToken;
        /** @returns {Fl32_Cms_Back_Publication_Family[]} */
        this.getPublicationFamilies = () => publicationFamilies;
        /** @returns {string[]} */
        this.getPublicationMachineLocales = () => machineLocales;
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        cast: 'Fl32_Cms_Back_Helper_Cast$',
        reader: 'TeqFw_Cfg_Reader$',
    }),
});
