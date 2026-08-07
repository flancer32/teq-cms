// @ts-check

/**
 * @namespace Fl32_Cms_Bootstrap_Configurator
 * @description Pre-DI host configurator for TeqCMS development.
 *
 * This module is loaded by @teqfw/cli through dynamic import before the DI
 * container is resolved. It must remain a plain host-composition module and
 * is intentionally outside teqfw-esm-validator validation.
 * @implements {TeqFw_Cli_Api_Container_Configurator}
 */
export default class Configurator {
    /**
     * @param {TeqFw_Cli_Api_Container_Configurator_Params} params
     * @returns {TeqFw_Cli_Api_Container_Configurator_Configuration}
     */
    configure({applicationRoot, argv}) {
        void applicationRoot;
        void argv;
        return {preprocessors: [createReplacePreprocessor()]};
    }
}

/** @returns {TeqFw_Cli_Api_Container_Preprocessor} */
function createReplacePreprocessor() {
    const replacements = new Map([
        ['Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Replace_Adapter'],
        ['Fl32_Tmpl_Back_Api_Engine', 'Fl32_Cms_Back_Di_Replace_Tmpl_Engine'],
    ]);
    return depId => {
        const replacement = replacements.get(depId.moduleName);
        return replacement ? Object.freeze({...depId, moduleName: replacement}) : depId;
    };
}
