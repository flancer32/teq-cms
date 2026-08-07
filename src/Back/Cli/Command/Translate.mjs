// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Command_Translate
 * @description CLI command for template translation.
 *
 * CLI command to translate HTML templates between locales using OpenAI-compatible LLM.
 *
 * This command scans base locale templates, detects changed files,
 * reads optional prompt files, invokes the LLM for translation,
 * and writes translated templates to appropriate paths.
 *
 * Designed for use within TeqCMS translation automation flow.
 */
export default class Fl32_Cms_Back_Cli_Command_Translate {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Defaults} deps.DEF
     * @param {TeqFw_Log_Provider} deps.logger
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Gate_OpenAI} deps.gateOpenAI
     * @param {Fl32_Cms_Back_Store_Db_Translate} deps.dbTranslate
     * @param {Fl32_Cms_Back_Helper_Translate} deps.helpTranslate
     * @param {Fl32_Cms_Back_Helper_File} deps.helpFile
     */
    constructor(
        {
            DEF,
            logger,
            config,
            tmplConfig,
            gateOpenAI,
            dbTranslate,
            helpFile,
            helpTranslate,
        }
    ) {
        // VARS
        const log = logger.forSource('Fl32_Cms_Back_Cli_Command_Translate');

        /**
         * Read streamed LLM content.
         * @param {AsyncIterable<object>} stream - Async iterator of streamed OpenAI response chunks.
         * @returns {Promise<string>} - Concatenated content received from the stream.
         */
        const readStreamedContent = async function (stream) {
            let result = '';
            for await (const chunk of stream) {
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) result += delta;
            }
            return result;
        };

        /**
         * Fetch completion with streaming and auto-continue.
         * @param {object} deps - Parameters object.
         * @param {Fl32_Cms_Back_Gate_OpenAI} deps.client - OpenAI HTTP gateway.
         * @param {string} deps.model - The model name to use.
         * @param {object[]} deps.messages - The message history used as the prompt.
         * @returns {Promise<string>}
         */
        const fetchFullCompletion = async function ({client, model, messages}) {
            let full = '';
            let done = false;
            let tries = 0;
            while (!done && tries < 10) {
                const stream = await client.createChatCompletion({model, messages});
                const part = await readStreamedContent(stream);
                full += part;
                if (/---END FILE---/.test(full)) {
                    done = true;
                } else {
                    messages.push({role: 'assistant', content: part});
                    messages.push({role: 'user', content: 'Continue.'});
                    tries++;
                }
            }
            return full;
        };

        // expose for unit testing
        this.__readStreamedContent = readStreamedContent;
        this.__fetchFullCompletion = fetchFullCompletion;

        // MAIN
        /**
         * @returns {Promise<void>}
         */
        this.id = 'cms:translate';
        this.summary = 'Translate CMS templates.';
        this.lifetime = 'finite';

        /**
         * @param {object} context
         * @returns {Promise<void>}
         */
        this.execute = async function (context) {
            void context;
            // FUNCS

            // MAIN
            const localeBase = config.getLocaleBaseTranslate();
            const localeAllowed = tmplConfig.getAvailableLocales();

            // load the base locale and initialize the translation DB
            await dbTranslate.init();
            await helpTranslate.syncDbWithFilesystem(dbTranslate);
            await dbTranslate.save();

            const model = config.getAiApiModel();
            const client = gateOpenAI;

            const db = dbTranslate.getData();
            for (const relPath of Object.keys(db)) {
                const pathBase = helpFile.getLocalizedPath({locale: localeBase, path: relPath});
                const stat = await helpFile.stat({path: pathBase});
                const mtimeDisk = stat.mtime.toISOString();

                const mtimeDb = dbTranslate.getMtime(relPath, localeBase);
                const hasChanged = !mtimeDb || mtimeDb < mtimeDisk;

                if (hasChanged) {
                    dbTranslate.setMtime(relPath, localeBase, mtimeDisk);
                    log.info(`Update the last changed date for the base template '${relPath}'.`);
                } else {
                    log.info(`The base template '${relPath}' is not changed.`);
                }

                const baseText = await helpFile.readText({path: pathBase});

                for (const locale of localeAllowed) {
                    if (locale === localeBase) continue; // skip base locale

                    const mtimeTrans = dbTranslate.getMtime(relPath, locale);
                    const needsTranslate = hasChanged || !mtimeTrans || mtimeTrans < mtimeDisk;
                    if (!needsTranslate) continue;

                    log.info(`Translate template '${relPath}' from '${localeBase}' to '${locale}'.`);

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

                    const content = await fetchFullCompletion({client, model, messages});
                    log.info('LLM streaming translation completed.');
                    const match = content.match(/---FILE: (.+?)---\n([\s\S]+?)\n---END FILE---/);
                    if (!match) {
                        log.error('Failed to extract generated file from response.');
                        const path = helpFile.replaceExt({path: pathTrans, ext: '.answer.md'});
                        await helpFile.writeText({path, text: content});
                        return;
                    }
                    const [, , text] = match;
                    await helpFile.writeText({path: pathTrans, text});
                    log.info(`Generated result saved to '${pathTrans}'`);
                    dbTranslate.setMtime(relPath, locale, (new Date()).toISOString());
                    await dbTranslate.save();
                }
            }

        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        DEF: 'Fl32_Cms_Back_Defaults$',
        logger: 'TeqFw_Log_Provider$',
        config: 'Fl32_Cms_Back_Config$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        gateOpenAI: 'Fl32_Cms_Back_Gate_OpenAI$',
        dbTranslate: 'Fl32_Cms_Back_Store_Db_Translate$',
        helpFile: 'Fl32_Cms_Back_Helper_File$',
        helpTranslate: 'Fl32_Cms_Back_Helper_Translate$',
    }),
});
