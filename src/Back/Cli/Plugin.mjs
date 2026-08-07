// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Plugin
 * @description Loads TeqCMS configuration before CLI command selection.
 */
export default class Fl32_Cms_Back_Cli_Plugin {
    /**
     * @param {object} deps
     * @param {TeqFw_Cfg_Loader} deps.loader
     * @param {TeqFw_Cfg_Source_Object} deps.object
     * @param {TeqFw_Cfg_Source_DotenvFile} deps.dotenv
     * @param {TeqFw_Cfg_Source_ProcessEnv} deps.processEnv
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     */
    constructor({loader, object, dotenv, processEnv, fs, path}) {
        /**
         * Loads application defaults, an optional dotenv file, and process environment values.
         *
         * @returns {Promise<void>}
         */
        this.onStartup = async function () {
            const defaults = {
                TEQFW_TMPL__ALLOWED_LOCALES: ['en', 'es', 'ru'],
                TEQFW_TMPL__DEFAULT_LOCALE: 'en',
                TEQFW_TMPL__ROOT_PATH: process.cwd(),
                TEQ_CMS__AI_API_MODEL: 'gpt-4o-mini',
                TEQ_CMS__LOCALE_BASE_TRANSLATE: 'ru',
            };
            const sources = [object.create(defaults, 'teq-cms-defaults')];

            const dotenvPath = path.join(process.cwd(), '.env');
            try {
                await fs.access(dotenvPath);
                sources.push(normalizeListValues(
                    dotenv.create({path: dotenvPath, id: 'project-dotenv'}),
                ));
            } catch {
                // An absent dotenv file is an optional configuration source.
            }

            sources.push(normalizeListValues(processEnv.create(process.env)));
            await loader.load(sources);
        };

        /**
         * TeqCMS has no process-wide shutdown resources.
         *
         * @returns {Promise<void>}
         */
        this.onShutdown = async function () {};
    }
}

/**
 * Normalizes comma-separated values before they enter typed configuration.
 *
 * Environment-backed Sources can only provide strings, while the tmpl
 * configuration contract exposes available locales as an array. The host
 * performs this boundary conversion because it owns configuration sources.
 *
 * @param {TeqFw_Cfg_Source__Captured} source
 * @returns {TeqFw_Cfg_Source__Captured}
 */
function normalizeListValues(source) {
    return Object.freeze({
        id: source.id,
        load: async () => {
            const entries = await source.load();
            return Object.freeze(entries.map(entry => {
                if (entry.key !== 'TEQFW_TMPL__ALLOWED_LOCALES' || typeof entry.value !== 'string') {
                    return entry;
                }
                const value = entry.value
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean);
                return Object.freeze({...entry, value});
            }));
        },
    });
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        loader: 'TeqFw_Cfg_Loader$',
        object: 'TeqFw_Cfg_Source_Object$',
        dotenv: 'TeqFw_Cfg_Source_DotenvFile$',
        processEnv: 'TeqFw_Cfg_Source_ProcessEnv$',
        fs: 'node:fs/promises',
        path: 'node:path',
    }),
});
