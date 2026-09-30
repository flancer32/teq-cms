// @ts-check

/**
 * @namespace Fl32_Cms_Back_Web_Handler_NotFound
 * @description Completes unmatched requests after normal CMS PROCESS handlers.
 * @implements TeqFw_Web_Back_Api_Handler
 */
export default class NotFound {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Web_Error_Respond} deps.errors
     * @param {TeqFw_Web_Back_Dto_Info__Factory} deps.dtoInfo
     * @param {TeqFw_Web_Back_Enum_Stage} deps.STAGE
     */
    constructor({errors, dtoInfo, STAGE}) {
        const info = dtoInfo.create({name: 'Fl32_Cms_Back_Web_Handler_NotFound', stage: STAGE.PROCESS,
            after: ['Fl32_Cms_Back_Publication_Handler', 'Fl32_Cms_Back_Web_Handler_Template',
                'Fl32_Cms_Back_Web_Handler_StaticRoute', 'TeqFw_Web_Back_Handler_Static',
                'Fl32_Cms_Back_Web_Handler_AgentMessage']});
        /** @returns {object} */
        this.getRegistrationInfo = () => info;
        /** @param {TeqFw_Web_Back_Pipeline_RequestContext} context @returns {Promise<void>} */
        this.handle = async context => { await errors.send({context}); };
    }
}

export const __deps__ = Object.freeze({default: Object.freeze({
    errors: 'Fl32_Cms_Back_Web_Error_Respond$',
    dtoInfo: 'TeqFw_Web_Back_Dto_Info__Factory$',
    STAGE: 'TeqFw_Web_Back_Enum_Stage$',
})});
