// @ts-check

/**
 * @namespace Fl32_Cms_Back_Di_Replace_Tmpl_Engine
 * @description Host adapter that delegates rendering to the configured tmpl engine.
 * @implements Fl32_Tmpl_Back_Api_Engine
 */
export default class Fl32_Cms_Back_Di_Replace_Tmpl_Engine {
    /**
     * @param {object} deps
     * @param {Fl32_Tmpl_Back_Config} deps.config
     * @param {Fl32_Tmpl_Back_Api_Engine} deps.simple
     * @param {Fl32_Tmpl_Back_Api_Engine} deps.mustache
     * @param {Fl32_Tmpl_Back_Api_Engine} deps.nunjucks
     */
    constructor({config, simple, mustache, nunjucks}) {
        const engines = {simple, mustache, nunjucks};
        const engine = engines[config.getEngine()] ?? simple;

        /**
         * @param {object} params
         * @returns {Promise<object>}
         */
        this.render = (params) => engine.render(params);
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        config: 'Fl32_Tmpl_Back_Config$',
        simple: 'Fl32_Tmpl_Back_Service_Engine_Simple$',
        mustache: 'Fl32_Tmpl_Back_Service_Engine_Mustache$',
        nunjucks: 'Fl32_Tmpl_Back_Service_Engine_Nunjucks$',
    }),
});
