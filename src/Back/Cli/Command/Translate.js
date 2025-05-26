/**
 * TODO
 */
export default class Fl32_Cms_Back_Cli_Command_Translate {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Cms_Back_Gate_OpenAI} gateOpenAI
     */
    constructor(
        {
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
            Fl32_Cms_Back_Gate_OpenAI$: gateOpenAI,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        // VARS

        // MAIN
        this.exec = async function () {
            const model = config.getAiApiModel();
            const client = await gateOpenAI.initClient();
            const completion = await client.chat.completions.create({
                model,
                messages: [{
                    role: 'system',
                    content: `Hello! How are you?`,
                }],
            });
            const content = completion.choices[0].message.content;
            logger.info(`LLM usage: ${JSON.stringify(completion.usage)}`);
        };
    }
}