// @ts-check

/**
 * @namespace Fl32_Cms_Back_Web_Handler_StaticRoute
 * @description Delivers host static exclusions before publication and template rendering.
 * @implements TeqFw_Web_Back_Api_Handler
 */
export default class StaticRoute {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Publication_Routing} deps.routing
     * @param {TeqFw_Web_Back_Handler_Static} deps.handStatic
     * @param {Fl32_Cms_Back_Web_Error_Respond} deps.errors
     * @param {TeqFw_Web_Back_Helper_Respond} deps.respond
     * @param {TeqFw_Web_Back_Dto_Info__Factory} deps.dtoInfo
     * @param {TeqFw_Web_Back_Enum_Stage} deps.STAGE
     * @param {typeof import('node:path')} deps.path
     */
    constructor({routing, handStatic, respond, errors, dtoInfo, STAGE, path}) {
        const info = dtoInfo.create({name: 'Fl32_Cms_Back_Web_Handler_StaticRoute', stage: STAGE.PROCESS,
            before: ['Fl32_Cms_Back_Publication_Handler', 'Fl32_Cms_Back_Web_Handler_Template', 'TeqFw_Web_Back_Handler_Static']});
        /** @returns {object} */
        this.getRegistrationInfo = () => info;
        /** @param {TeqFw_Web_Back_Pipeline_RequestContext} context @returns {Promise<void>} */
        this.handle = async context => {
            if (!respond.isWritable(context.response)) return;
            const raw = (context.request.url ?? '').split('?')[0];
            let decoded;
            try { decoded = decodeURIComponent(raw); } catch { return; }
            if (routing.isEndpoint(decoded)) return;
            const normalized = path.posix.normalize(decoded);
            if (!routing.isStatic(decoded) && !routing.isStatic(normalized)) return;
            if (raw === decoded && decoded === normalized) await handStatic.handle(context);
            if (!context.completed) {
                await errors.send({context, kind: 'static'});
            }
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        routing: 'Fl32_Cms_Back_Publication_Routing$',
        handStatic: 'TeqFw_Web_Back_Handler_Static$',
        respond: 'TeqFw_Web_Back_Helper_Respond$',
        errors: 'Fl32_Cms_Back_Web_Error_Respond$',
        dtoInfo: 'TeqFw_Web_Back_Dto_Info__Factory$',
        STAGE: 'TeqFw_Web_Back_Enum_Stage$',
        path: 'node:path',
    }),
});
