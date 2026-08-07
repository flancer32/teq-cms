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
         * Loads defaults, an optional dotenv file, and process environment values.
         *
         * @returns {Promise<void>}
         */
        this.onStartup = async function () {
            const root = process.env.TEQ_CMS_ROOT
                ? path.resolve(process.cwd(), process.env.TEQ_CMS_ROOT)
                : process.cwd();
            const defaults = {
                    TEQFW_TMPL__ALLOWED_LOCALES: process.env.TEQ_CMS_LOCALE_ALLOWED?.split(',') || ['en', 'es', 'ru'],
                    TEQFW_TMPL__DEFAULT_LOCALE: process.env.TEQ_CMS_LOCALE_BASE_DISPLAY || 'en',
                    TEQFW_TMPL__ENGINE: process.env.TEQ_CMS_TMPL_ENGINE || 'nunjucks',
                    TEQFW_TMPL__ROOT_PATH: root,
                    TEQFW_WEB__PORT: process.env.TEQ_CMS_SERVER_PORT || 3000,
                    TEQFW_WEB__TYPE: process.env.TEQ_CMS_SERVER_TYPE || 'http',
                    TEQ_CMS__AI_API_BASE_URL: process.env.TEQ_CMS_AI_API_BASE_URL,
                    TEQ_CMS__AI_API_KEY: process.env.TEQ_CMS_AI_API_KEY,
                    TEQ_CMS__AI_API_MODEL: process.env.TEQ_CMS_AI_API_MODEL || 'gpt-4o-mini',
                    TEQ_CMS__AI_API_ORG: process.env.TEQ_CMS_AI_API_ORG,
                    TEQ_CMS__BASE_URL: process.env.TEQ_CMS_BASE_URL,
                    TEQ_CMS__LOCALE_ALLOWED: process.env.TEQ_CMS_LOCALE_ALLOWED?.split(',') || ['en', 'es', 'ru'],
                    TEQ_CMS__LOCALE_BASE_TRANSLATE: process.env.TEQ_CMS_LOCALE_BASE_TRANSLATE || 'ru',
                    TEQ_CMS__LOCALE_BASE_WEB: process.env.TEQ_CMS_LOCALE_BASE_DISPLAY || 'en',
                    TEQ_CMS__ROOT_PATH: root,
            };
            for (const key of Object.keys(defaults)) {
                if (defaults[key] === undefined) delete defaults[key];
            }
            const sources = [object.create(defaults, 'teq-cms-defaults')];

            const dotenvPath = path.join(root, '.env');
            try {
                await fs.access(dotenvPath);
                sources.push(dotenv.create({path: dotenvPath, id: 'project-dotenv'}));
            } catch {
                // An absent dotenv file is an optional configuration source.
            }

            sources.push(processEnv.create(process.env));
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
