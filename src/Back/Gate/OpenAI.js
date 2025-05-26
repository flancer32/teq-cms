/**
 * TODO
 */
export default class Fl32_Cms_Back_Gate_OpenAI {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('openai')} openai
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     */
    constructor(
        {
            'node:openai': openai,
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        // VARS
        const {default: OpenAI} = openai;

        // MAIN
        this.initClient = async function () {
            const apiKey = config.getAiApiKey();
            const baseURL = config.getAiApiBaseUrl();
            const organization = config.getAiApiOrg();
            return new OpenAI({baseURL, apiKey, organization});
        };
    }
}
