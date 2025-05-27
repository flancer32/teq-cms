/**
 * TODO
 */
export default class Fl32_Cms_Back_Cli_Command_Translate {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Cms_Back_Gate_OpenAI} gateOpenAI
     * @param {Fl32_Cms_Back_Store_Db_Translate} dbTranslate
     * @param {Fl32_Cms_Back_Service_Tmpl_Scanner} servScanner
     */
    constructor(
        {
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
            Fl32_Cms_Back_Gate_OpenAI$: gateOpenAI,
            Fl32_Cms_Back_Store_Db_Translate$: dbTranslate,
            Fl32_Cms_Back_Service_Tmpl_Scanner$: servScanner,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        // VARS

        // MAIN
        this.exec = async function () {
            // FUNCS
            /**
             * Synchronizes Translate DB with the current file system state.
             * Adds missing entries and removes obsolete ones.
             *
             * @param {object} args
             * @param {object} args.dbTranslate - Instance of Fl32_Cms_Back_Store_Db_Translate
             * @param {object} args.servScanner - Instance of Fl32_Cms_Back_Service_Tmpl_Scanner
             * @param {string} args.localeBase - Base locale code
             */
            async function syncTranslateDbWithFiles({dbTranslate, servScanner, localeBase}) {
                const scanned = await servScanner.scan(); // { relPath: { [localeBase]: isoDate }, ... }

                const scannedPaths = new Set(Object.keys(scanned));
                const existingPaths = new Set(Object.keys(dbTranslate.getData())); // assumes getData() gives full internal _data

                // Add or update entries
                for (const relPath of scannedPaths) {
                    const newMtime = scanned[relPath][localeBase];
                    const oldMtime = dbTranslate.getMtime(relPath, localeBase);
                    if (!oldMtime || oldMtime !== newMtime) {
                        dbTranslate.setMtime(relPath, localeBase, newMtime);
                    }
                }

                // Remove obsolete entries
                for (const relPath of existingPaths) {
                    if (!scannedPaths.has(relPath)) {
                        dbTranslate.remove(relPath);
                    }
                }
            }

            // MAIN
            const localeBase = config.getLocaleBaseTranslate();
            // load the base locale and initialize the translation DB
            await dbTranslate.init();
            await syncTranslateDbWithFiles({dbTranslate, servScanner, localeBase});
            await dbTranslate.save();

            // const model = config.getAiApiModel();
            // const client = await gateOpenAI.initClient();

            // const completion = await client.chat.completions.create({
            //     model,
            //     messages: [{
            //         role: 'system',
            //         content: `Hello! How are you?`,
            //     }],
            // });
            // const content = completion.choices[0].message.content;
            // logger.info(`LLM usage: ${JSON.stringify(completion.usage)}`);
        };
    }
}