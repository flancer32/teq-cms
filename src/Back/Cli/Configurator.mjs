// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Configurator
 * @description Host container configurator for TeqCMS CLI composition.
 */
export default class Fl32_Cms_Back_Cli_Configurator {
    /**
     * Creates the host configuration extensions for the TeqFW CLI.
     */
    constructor() {
        /**
         * @param {object} deps
         * @param {string} deps.applicationRoot
         * @param {string[]} deps.argv
         * @returns {object}
         */
        this.configure = function ({applicationRoot, argv}) {
            void applicationRoot;
            void argv;
            return {
                preprocessors: [createReplacePreprocessor()],
            };
        };
    }
}

/**
 * Creates the dependency substitution preprocessor.
 *
 * @returns {function(object): object}
 */
function createReplacePreprocessor() {
    const replacements = new Map([
        ['Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Replace_Adapter'],
        ['Fl32_Tmpl_Back_Api_Engine', selectTemplateEngine(process.env.TEQ_CMS_TMPL_ENGINE)],
    ]);
    return (depId) => {
        const replacement = replacements.get(depId.moduleName);
        return replacement ? Object.freeze({...depId, moduleName: replacement}) : depId;
    };
}

/**
 * Selects the configured template engine implementation.
 *
 * @param {string|undefined} engine
 * @returns {string}
 */
function selectTemplateEngine(engine) {
    if (engine === 'nunjucks') return 'Fl32_Tmpl_Back_Service_Engine_Nunjucks';
    if (engine === 'mustache') return 'Fl32_Tmpl_Back_Service_Engine_Mustache';
    return 'Fl32_Tmpl_Back_Service_Engine_Simple';
}
