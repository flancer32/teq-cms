// @ts-check

/**
 * @namespace Fl32_Cms_Back_Gate_OpenAI
 * @description OpenAI client gateway.
 */
export default class Fl32_Cms_Back_Gate_OpenAI {
    /**
     * @param {object} deps
     * @param {typeof import('openai')} deps.openai
     * @param {Fl32_Cms_Back_Config} deps.config
     */
    constructor(
        {
            openai,
            config,
        }
    ) {
        // VARS
        const {default: OpenAI} = openai;

        // MAIN
        /**
         * @returns {Promise<object>}
         */
        this.initClient = async function () {
            const apiKey = config.getAiApiKey();
            const baseURL = config.getAiApiBaseUrl();
            const organization = config.getAiApiOrganization();
            return new OpenAI({baseURL, apiKey, organization});
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        openai: 'npm:openai',
        config: 'Fl32_Cms_Back_Config$',
    }),
});
