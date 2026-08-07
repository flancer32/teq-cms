// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Plugin
 * @description Loads configuration and configures the CMS web pipeline.
 */
export default class Fl32_Cms_Back_Cli_Plugin {
    /**
     * @param {object} deps
     * @param {TeqFw_Cfg_Loader} deps.loader
     * @param {TeqFw_Cfg_Source_Object} deps.object
     * @param {TeqFw_Cfg_Source_DotenvFile} deps.dotenv
     * @param {TeqFw_Cfg_Source_ProcessEnv} deps.processEnv
     * @param {Fl32_Web_Back_PipelineEngine} deps.pipeline
     * @param {Fl32_Web_Back_Handler_Pre_Log} deps.handLog
     * @param {Fl32_Web_Back_Handler_Static} deps.handStatic
     * @param {Fl32_Cms_Back_Web_Handler_Template} deps.handTmpl
     * @param {Fl32_Web_Back_Dto_Source__Factory} deps.dtoSource
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     */
    constructor({
        loader,
        object,
        dotenv,
        processEnv,
        pipeline,
        handLog,
        handStatic,
        handTmpl,
        dtoSource,
        fs,
        path,
    }) {
        /**
         * Loads cfg and registers CMS handlers before the web command starts.
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
                sources.push(normalizeListValues(dotenv.create({path: dotenvPath, id: 'project-dotenv'})));
            } catch {
                // An absent dotenv file is an optional configuration source.
            }
            sources.push(normalizeListValues(processEnv.create(process.env)));
            await loader.load(sources);

            const source = dtoSource.create({
                root: path.join(process.cwd(), 'web'),
                prefix: '/',
                allow: {'.': ['.']},
                defaults: ['index.html'],
            });
            await handStatic.init({sources: [source]});
            pipeline.addHandler(handLog);
            pipeline.addHandler(handStatic);
            pipeline.addHandler(handTmpl);
        };

        /**
         * Releases no plugin-owned resources.
         *
         * @returns {Promise<void>}
         */
        this.onShutdown = async function () {};
    }
}

/**
 * @param {TeqFw_Cfg_Source__Captured} source
 * @returns {TeqFw_Cfg_Source__Captured}
 */
function normalizeListValues(source) {
    return Object.freeze({
        id: source.id,
        load: async () => Object.freeze((await source.load()).map(entry => {
            if (entry.key !== 'TEQFW_TMPL__ALLOWED_LOCALES' || typeof entry.value !== 'string') return entry;
            const value = entry.value.split(',').map(item => item.trim()).filter(Boolean);
            return Object.freeze({...entry, value});
        })),
    });
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        loader: 'TeqFw_Cfg_Loader$',
        object: 'TeqFw_Cfg_Source_Object$',
        dotenv: 'TeqFw_Cfg_Source_DotenvFile$',
        processEnv: 'TeqFw_Cfg_Source_ProcessEnv$',
        pipeline: 'Fl32_Web_Back_PipelineEngine$',
        handLog: 'Fl32_Web_Back_Handler_Pre_Log$',
        handStatic: 'Fl32_Web_Back_Handler_Static$',
        handTmpl: 'Fl32_Cms_Back_Web_Handler_Template$',
        dtoSource: 'Fl32_Web_Back_Dto_Source__Factory$',
        fs: 'node:fs/promises',
        path: 'node:path',
    }),
});
