/**
 * TODO
 */
export default class Fl32_Cms_Back_Cli_Command_Translate {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {Fl32_Cms_Back_Defaults} DEF
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Cms_Back_Gate_OpenAI} gateOpenAI
     * @param {Fl32_Cms_Back_Store_Db_Translate} dbTranslate
     * @param {Fl32_Cms_Back_Service_Tmpl_Scanner} servScanner
     * @param {Fl32_Cms_Back_Helper_File} helpFile
     */
    constructor(
        {
            Fl32_Cms_Back_Defaults$: DEF,
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
            Fl32_Cms_Back_Gate_OpenAI$: gateOpenAI,
            Fl32_Cms_Back_Store_Db_Translate$: dbTranslate,
            Fl32_Cms_Back_Service_Tmpl_Scanner$: servScanner,
            Fl32_Cms_Back_Helper_File$: helpFile,
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
            const localeAllowed = config.getLocaleAllowed();

            // load the base locale and initialize the translation DB
            await dbTranslate.init();
            await syncTranslateDbWithFiles({dbTranslate, servScanner, localeBase});
            await dbTranslate.save();

            const model = config.getAiApiModel();
            const client = await gateOpenAI.initClient();

            const db = dbTranslate.getData();
            for (const relPath of Object.keys(db)) {
                const pathBase = helpFile.getLocalizedPath({locale: localeBase, relPath});
                const stat = await helpFile.stat(pathBase);
                const mtimeDisk = stat.mtime.toISOString();

                const mtimeDb = dbTranslate.getMtime(relPath, localeBase);
                const hasChanged = !mtimeDb || mtimeDb < mtimeDisk;

                if (hasChanged) {
                    dbTranslate.setMtime(relPath, localeBase, mtimeDisk);
                    logger.info(`Update the last changed date for the base template '${relPath}'.`);
                } else {
                    logger.info(`The base template '${relPath}' is not changed.`);
                }

                const baseText = await helpFile.readText(pathBase);

                for (const locale of localeAllowed) {
                    if (locale === localeBase) continue; // skip base locale

                    const mtimeTrans = dbTranslate.getMtime(relPath, locale);
                    const needsTranslate = hasChanged || !mtimeTrans || mtimeTrans < mtimeDisk;
                    if (!needsTranslate) continue;

                    logger.info(`Translate template '${relPath}' from '${localeBase}' to '${locale}'.`);

                    const pathTrans = helpFile.getLocalizedPath({locale, relPath});
                    const pathPrompt = pathTrans + '.prompt.md';

                    let promptText = '';
                    if (await helpFile.exists(pathPrompt)) {
                        promptText = await helpFile.readText(pathPrompt);
                    }

                    /** @type {Array<{role: 'system'|'user', content: string}>} */
                    const messages = [
                        {role: 'system', content: DEF.PROMPT_SYSTEM},
                        {role: 'user', content: `Translate template "${relPath}" from ${localeBase} to ${locale}.`},
                    ];
                    if (promptText) {
                        messages.push({role: 'user', content: promptText});
                    }
                    messages.push({role: 'user', content: baseText});

                    const completion = await client.chat.completions.create({
                        model,
                        messages,
                    });
                    const content = completion.choices[0].message.content;
                    logger.info(`LLM usage: ${JSON.stringify(completion.usage)}`);
                    const match = content.match(/---FILE: (.+?)---\n([\s\S]+?)\n---END FILE---/);
                    if (!match) {
                        logger.error('Failed to extract generated file from response.');
                        await helpFile.writeText(pathTrans, content);
                        return;
                    }
                    const [, , textResult] = match;
                    await helpFile.writeText(pathTrans, textResult);
                    logger.info(`Generated result saved to '${pathTrans}'`);
                    dbTranslate.setMtime(relPath, locale, (new Date()).toISOString());
                    await dbTranslate.save();
                }
            }

        };
    }
}