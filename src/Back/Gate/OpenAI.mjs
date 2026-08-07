// @ts-check

/**
 * @namespace Fl32_Cms_Back_Gate_OpenAI
 * @description OpenAI client gateway.
 */
export default class Fl32_Cms_Back_Gate_OpenAI {
    /**
     * @param {object} deps
     * @param {typeof import('openai')} deps.openai
     * @param {TeqFw_Cfg_Reader} deps.reader
     */
    constructor(
        {
            openai,
            reader,
        }
    ) {
        // VARS
        const {default: OpenAI} = openai;

        // MAIN
        /**
         * @returns {Promise<object>}
         */
        this.initClient = async function () {
            const config = reader.get('TEQ_CMS');
            const apiKey = config.AI_API_KEY;
            const baseURL = config.AI_API_BASE_URL;
            const organization = config.AI_API_ORG;
            return new OpenAI({baseURL, apiKey, organization});
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        openai: 'npm:openai',
        reader: 'TeqFw_Cfg_Reader$',
    }),
});
