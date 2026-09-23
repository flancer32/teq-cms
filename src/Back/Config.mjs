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
        const apiBaseUrl = cast.string(raw.AI_API_BASE_URL);
        const apiKey = cast.string(raw.AI_API_KEY);
        const apiModel = cast.string(raw.AI_API_MODEL) ?? 'gpt-4o-mini';
        const apiOrganization = cast.string(raw.AI_API_ORG);
        const localeBaseTranslate = cast.string(raw.LOCALE_BASE_TRANSLATE) ?? 'ru';
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
        const discoveryPath = cast.string(raw.PUBLICATION_DISCOVERY_PATH) ?? '/llms.txt';
        if (!/^\/[a-zA-Z0-9_-]+\.txt$/.test(discoveryPath)) {
            throw new Error('Invalid PUBLICATION_DISCOVERY_PATH.');
        }

        /** @returns {string|undefined} Canonical CMS base URL. */
        this.getBaseUrl = () => baseUrl;
        /** @returns {string|undefined} OpenAI-compatible API base URL. */
        this.getAiApiBaseUrl = () => apiBaseUrl;
        /** @returns {string|undefined} OpenAI API key. */
        this.getAiApiKey = () => apiKey;
        /** @returns {string} OpenAI model name. */
        this.getAiApiModel = () => apiModel;
        /** @returns {string|undefined} OpenAI organization identifier. */
        this.getAiApiOrganization = () => apiOrganization;
        /** @returns {string} Base locale used for translation. */
        this.getLocaleBaseTranslate = () => localeBaseTranslate;
        /** @returns {Fl32_Cms_Back_Publication_Family[]} */
        this.getPublicationFamilies = () => publicationFamilies;
        /** @returns {string[]} */
        this.getPublicationMachineLocales = () => machineLocales;
        /** @returns {string} */
        this.getPublicationDiscoveryPath = () => discoveryPath;
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        cast: 'Fl32_Cms_Back_Helper_Cast$',
        reader: 'TeqFw_Cfg_Reader$',
    }),
});
