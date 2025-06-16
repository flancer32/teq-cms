/**
 * TODO
 */
export default class Fl32_Cms_Back_Cli_Command {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Cms_Back_Gate_OpenAI} gateOpenAI
     * @param {Fl32_Cms_Back_Cli_Command_Translate} cmdTranslate
     * @param {Fl32_Cms_Back_Cli_Command_Web} cmdWeb
     */
    constructor(
        {
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
            Fl32_Cms_Back_Gate_OpenAI$: gateOpenAI,
            Fl32_Cms_Back_Cli_Command_Translate$: cmdTranslate,
            Fl32_Cms_Back_Cli_Command_Web$: cmdWeb,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        // VARS

        // MAIN
        this.run = async function (root, argv) {
            // configure the plugin
            config.init({
                aiApiBaseUrl: process.env.TEQ_CMS_AI_API_BASE_URL,
                aiApiKey: process.env.TEQ_CMS_AI_API_KEY,
                aiApiModel: process.env.TEQ_CMS_AI_API_MODEL,
                aiApiOrg: process.env.TEQ_CMS_AI_API_ORG,
                localeAllowed: process.env.TEQ_CMS_LOCALE_ALLOWED.split(','),
                localeBaseTranslate: process.env.TEQ_CMS_LOCALE_BASE_TRANSLATE,
                localeBaseWeb: process.env.TEQ_CMS_LOCALE_BASE_DISPLAY,
                rootPath: root,
                tmplEngine: process.env.TEQ_CMS_TMPL_ENGINE,
            });

            const cmd = argv[2];
            switch (cmd) {
                case CMD.TRANSLATE:
                    await cmdTranslate.exec();
                    break;
                case CMD.WEB:
                    await cmdWeb.exec();
                    break;
                default:
                    console.log('Unknown command:', cmd);
                    process.exit(1);
            }
        };
    }
}

// VARS

const CMD = {
    TRANSLATE: 'translate',
    WEB: 'web',
};