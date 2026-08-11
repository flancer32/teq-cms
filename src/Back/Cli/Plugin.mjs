// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Plugin
 * @description Configures the CMS web pipeline.
 */
export default class Fl32_Cms_Back_Cli_Plugin {
    /**
     * @param {object} deps
     * @param {TeqFw_Web_Back_PipelineEngine} deps.pipeline
     * @param {TeqFw_Web_Back_Handler_Pre_Log} deps.handLog
     * @param {TeqFw_Web_Back_Handler_Static} deps.handStatic
     * @param {Fl32_Cms_Back_Web_Handler_Template} deps.handTmpl
     * @param {TeqFw_Web_Back_Dto_Source__Factory} deps.dtoSource
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {typeof import('node:path')} deps.path
     */
    constructor({pipeline, handLog, handStatic, handTmpl, dtoSource, tmplConfig, path}) {
        /**
         * Registers CMS handlers before the web command starts.
         *
         * @returns {Promise<void>}
         */
        this.onStartup = async function () {
            const source = dtoSource.create({
                root: path.join(tmplConfig.getRootPath(), 'web'),
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

export const __deps__ = Object.freeze({
    default: Object.freeze({
        pipeline: 'TeqFw_Web_Back_PipelineEngine$',
        handLog: 'TeqFw_Web_Back_Handler_Pre_Log$',
        handStatic: 'TeqFw_Web_Back_Handler_Static$',
        handTmpl: 'Fl32_Cms_Back_Web_Handler_Template$',
        dtoSource: 'TeqFw_Web_Back_Dto_Source__Factory$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        path: 'node:path',
    }),
});
