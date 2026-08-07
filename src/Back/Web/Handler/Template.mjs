// @ts-check

/**
 * @namespace Fl32_Cms_Back_Web_Handler_Template
 * @description CMS template rendering web handler.
 *
 * CMS template handler for web requests implementing Fl32_Web_Back_Api_Handler.
 * @implements Fl32_Web_Back_Api_Handler
 */
export default class Fl32_Cms_Back_Web_Handler_Template {
    /**
     * @param {object} deps
     * @param {typeof import('node:http2')} deps.http2
     * @param {TeqFw_Log_Provider} deps.logger
     * @param {Fl32_Web_Back_Helper_Respond} deps.respond
     * @param {Fl32_Web_Back_Dto_Info__Factory} deps.dtoInfo
     * @param {Fl32_Tmpl_Back_Service_Load} deps.servTmplLoad
     * @param {Fl32_Tmpl_Back_Service_Render} deps.servTmplRender
     * @param {Fl32_Cms_Back_Api_Adapter} deps.adapter
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Web_Back_Enum_Stage} deps.STAGE
     */
    constructor(
        {
            http2,
            logger,
            respond,
            dtoInfo,
            servTmplLoad,
            servTmplRender,
            adapter,
            tmplConfig,
            STAGE,
        }
    ) {
        const {constants: H2} = http2;
        const log = logger.forSource('Fl32_Cms_Back_Web_Handler_Template');
        const {
            HTTP2_HEADER_CONTENT_ENCODING,
            HTTP2_HEADER_CONTENT_LENGTH,
            HTTP_STATUS_FOUND,
        } = H2;

        const _info = dtoInfo.create({
            name: 'Fl32_Cms_Back_Web_Handler_Template',
            stage: STAGE.PROCESS,
            before: ['Fl32_Web_Back_Handler_Static'],
        });

        /**
         * @param {object} context
         * @returns {Promise<void>}
         */
        this.handle = async function (context) {
            const {request: req, response: res} = context;
            if (!respond.isWritable(res)) return;

            try {
                const {target, data, options} = await adapter.getRenderData({req});
                const {template} = await servTmplLoad.perform({target});
                if (template) {
                    const url = req.url || '';
                    const hasLocale = tmplConfig.getAvailableLocales()
                        .some(loc => url === `/${loc}` || url.startsWith(`/${loc}/`));

                    if (!hasLocale) {
                        // TODO: move this code to Fl32_Web_Back_Helper_Respond
                        const loc = target.locales.user ?? tmplConfig.getDefaultLocale();
                        const newLoc = url.startsWith('/') ? `/${loc}${url}` : `/${loc}/${url}`;
                        res.writeHead(HTTP_STATUS_FOUND, {location: newLoc});
                        res.end();
                        context.completed = true;
                        return;
                    }

                    const {content} = await servTmplRender.perform({
                        target,
                        template,
                        data,
                        options,
                    });
                    if (content) {
                        const bodyBuffer = Buffer.from(content, 'utf-8');
                        const headers = {
                            [HTTP2_HEADER_CONTENT_ENCODING]: 'utf-8',
                            [HTTP2_HEADER_CONTENT_LENGTH]: bodyBuffer.length,
                        };
                        respond.code200_Ok({res, headers, body: content});
                        context.completed = true;
                        return;
                    }
                }
                return;
            } catch (e) {
                log.error('Template handler failed.', {err: e});
            }
        };

        /**
         * @returns {object}
         */
        this.getRegistrationInfo = () => _info;
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        http2: 'node:http2',
        logger: 'TeqFw_Log_Provider$',
        respond: 'Fl32_Web_Back_Helper_Respond$',
        dtoInfo: 'Fl32_Web_Back_Dto_Info__Factory$',
        servTmplLoad: 'Fl32_Tmpl_Back_Service_Load$',
        servTmplRender: 'Fl32_Tmpl_Back_Service_Render$',
        adapter: 'Fl32_Cms_Back_Api_Adapter$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        STAGE: 'Fl32_Web_Back_Enum_Stage$',
    }),
});
