// @ts-check

/**
 * @namespace Fl32_Cms_Back_Di_Preprocessor
 * @description Maps the CMS and template extension contracts to standalone-host implementations.
 */

/**
 * @returns {Function}
 */
export default function Fl32_Cms_Back_Di_Preprocessor() {
    const replacements = new Map([
        ['Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Replace_Adapter'],
        ['Fl32_Tmpl_Back_Api_Engine', 'Fl32_Cms_Back_Di_Replace_Tmpl_Engine'],
    ]);
    /**
     * @param {TeqFw_Di_Dto_DepId} depId
     * @returns {TeqFw_Di_Dto_DepId}
     */
    return function preprocess(depId) {
        const replacement = replacements.get(depId.address);
        return replacement ? Object.freeze({...depId, address: replacement}) : depId;
    };
}
