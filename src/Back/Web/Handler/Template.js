/**
 * CMS template handler for web requests implementing Fl32_Web_Back_Api_Handler.
 * @implements Fl32_Web_Back_Api_Handler
 */
export default class Fl32_Cms_Back_Web_Handler_Template {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:http2')} http2
     * @param {Fl32_Web_Back_Logger} logger
     * @param {Fl32_Web_Back_Helper_Mime} helpMime
     * @param {Fl32_Web_Back_Helper_Respond} respond
     * @param {Fl32_Web_Back_Dto_Handler_Info} dtoInfo
     * @param {Fl32_Tmpl_Back_Service_Load} servTmplLoad
     * @param {Fl32_Tmpl_Back_Service_Render} servTmplRender
     * @param {Fl32_Cms_Back_Api_Adapter} adapter
     * @param {Fl32_Cms_Back_Config} config
     * @param {typeof Fl32_Web_Back_Enum_Stage} STAGE
     */
    constructor(
        {
            'node:http2': http2,
            Fl32_Web_Back_Logger$: logger,
            Fl32_Web_Back_Helper_Mime$: helpMime,
            Fl32_Web_Back_Helper_Respond$: respond,
            Fl32_Web_Back_Dto_Handler_Info$: dtoInfo,
            Fl32_Tmpl_Back_Service_Load$: servTmplLoad,
            Fl32_Tmpl_Back_Service_Render$: servTmplRender,
            Fl32_Cms_Back_Api_Adapter$: adapter,
            Fl32_Cms_Back_Config$: config,
            Fl32_Web_Back_Enum_Stage$: STAGE,
        }
    ) {
        /* eslint-enable jsdoc/check-param-names */
        const {constants: H2} = http2;
        const {
            HTTP2_HEADER_CONTENT_ENCODING,
            HTTP2_HEADER_CONTENT_LENGTH,
            HTTP_STATUS_OK,
            HTTP_STATUS_FOUND,
        } = H2;

        const _info = dtoInfo.create();
        _info.name = this.constructor.name;
        _info.stage = STAGE.PROCESS;
        _info.before = ['Fl32_Web_Back_Handler_Static'];
        Object.freeze(_info);

        this.handle = async function (req, res) {
            if (!respond.isWritable(res)) return false;

            try {
                const {target, data, options} = await adapter.getRenderData({req});
                const {resultCode, template} = await servTmplLoad.perform({target});
                if (template) {
                    const url = req.url || '';
                    const hasLocale = config.getLocaleAllowed().some(loc => url === `/${loc}` || url.startsWith(`/${loc}/`));

                    if (!hasLocale) {
                        const loc = target.locales.user ?? config.getLocaleBaseWeb();
                        const newLoc = url.startsWith('/') ? `/${loc}${url}` : `/${loc}/${url}`;
                        res.writeHead(HTTP_STATUS_FOUND, {location: newLoc});
                        res.end();
                        return true;
                    }

                    const {resultCode, content} = await servTmplRender.perform({
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
                        return true;
                    }
                }
                return false;
            } catch (e) {
                logger.exception(e);
                return false;
            }
        };

        this.getRegistrationInfo = () => _info;
    }
}
