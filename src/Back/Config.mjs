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
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        cast: 'Fl32_Cms_Back_Helper_Cast$',
        reader: 'TeqFw_Cfg_Reader$',
    }),
});
