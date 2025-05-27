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
     * @param {Fl32_Cms_Back_Helper_Translate} helpTranslate
     * @param {Fl32_Cms_Back_Helper_File} helpFile
     */
    constructor(
        {
            Fl32_Cms_Back_Defaults$: DEF,
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
            Fl32_Cms_Back_Gate_OpenAI$: gateOpenAI,
            Fl32_Cms_Back_Store_Db_Translate$: dbTranslate,
            Fl32_Cms_Back_Helper_File$: helpFile,
            Fl32_Cms_Back_Helper_Translate$: helpTranslate,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        // VARS

        // MAIN
        this.exec = async function () {
            // FUNCS

            // MAIN
            const localeBase = config.getLocaleBaseTranslate();
            const localeAllowed = config.getLocaleAllowed();

            // load the base locale and initialize the translation DB
            await dbTranslate.init();
            await helpTranslate.syncDbWithFilesystem(dbTranslate);
            await dbTranslate.save();

            const model = config.getAiApiModel();
            const client = await gateOpenAI.initClient();

            const db = dbTranslate.getData();
            for (const relPath of Object.keys(db)) {
                const pathBase = helpFile.getLocalizedPath({locale: localeBase, path: relPath});
                const stat = await helpFile.stat({path: pathBase});
                const mtimeDisk = stat.mtime.toISOString();

                const mtimeDb = dbTranslate.getMtime(relPath, localeBase);
                const hasChanged = !mtimeDb || mtimeDb < mtimeDisk;

                if (hasChanged) {
                    dbTranslate.setMtime(relPath, localeBase, mtimeDisk);
                    logger.info(`Update the last changed date for the base template '${relPath}'.`);
                } else {
                    logger.info(`The base template '${relPath}' is not changed.`);
                }

                const baseText = await helpFile.readText({path: pathBase});

                for (const locale of localeAllowed) {
                    if (locale === localeBase) continue; // skip base locale

                    const mtimeTrans = dbTranslate.getMtime(relPath, locale);
                    const needsTranslate = hasChanged || !mtimeTrans || mtimeTrans < mtimeDisk;
                    if (!needsTranslate) continue;

                    logger.info(`Translate template '${relPath}' from '${localeBase}' to '${locale}'.`);

                    const pathTrans = helpFile.getLocalizedPath({locale, path: relPath});
                    const pathPrompt = helpFile.replaceExt({path: pathTrans, ext: '.prompt.md'});

                    let promptText = '';
                    if (await helpFile.exists({path: pathPrompt})) {
                        promptText = await helpFile.readText({path: pathPrompt});
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
                        const path = helpFile.replaceExt({path: pathTrans, ext: '.answer.md'});
                        await helpFile.writeText({path, text: content});
                        return;
                    }
                    const [, , text] = match;
                    await helpFile.writeText({path: pathTrans, text});
                    logger.info(`Generated result saved to '${pathTrans}'`);
                    dbTranslate.setMtime(relPath, locale, (new Date()).toISOString());
                    await dbTranslate.save();
                }
            }

        };
    }
}