/**
 * CMS template handler for web requests implementing Fl32_Web_Back_Api_Handler.
 */
export default class Fl32_Cms_Back_Web_Handler_Template {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:fs')} fs
     * @param {typeof import('node:http2')} http2
     * @param {typeof import('node:path')} path
     * @param {Fl32_Web_Back_Logger} logger
     * @param {Fl32_Web_Back_Helper_Mime} helpMime
     * @param {Fl32_Web_Back_Helper_Respond} respond
     * @param {Fl32_Web_Back_Dto_Handler_Info} dtoInfo
     * @param {Fl32_Tmpl_Back_Act_File_Find} actTmplFind
     * @param {Fl32_Tmpl_Back_Service_Load} servTmplLoad
     * @param {Fl32_Tmpl_Back_Service_Render} servTmplRender
     * @param {Fl32_Cms_Back_Api_Adapter} adapter
     * @param {typeof Fl32_Web_Back_Enum_Stage} STAGE
     */
    constructor(
        {
            'node:fs': fs,
            'node:http2': http2,
            'node:path': path,
            Fl32_Web_Back_Logger$: logger,
            Fl32_Web_Back_Helper_Mime$: helpMime,
            Fl32_Web_Back_Helper_Respond$: respond,
            Fl32_Web_Back_Dto_Handler_Info$: dtoInfo,
            Fl32_Tmpl_Back_Act_File_Find$: actTmplFind,
            Fl32_Tmpl_Back_Service_Load$: servTmplLoad,
            Fl32_Tmpl_Back_Service_Render$: servTmplRender,
            Fl32_Cms_Back_Api_Adapter$: adapter,
            Fl32_Web_Back_Enum_Stage$: STAGE,
        }
    ) {
        /* eslint-enable jsdoc/check-param-names */
        // VARS
        const {promises: fsp} = fs;
        const {constants: H2} = http2;
        const {
            HTTP2_HEADER_CONTENT_ENCODING,
            HTTP2_HEADER_CONTENT_LENGTH,
            HTTP2_HEADER_CONTENT_TYPE,
            HTTP2_HEADER_LAST_MODIFIED,
            HTTP_STATUS_OK,
        } = H2;

        /**
         * @type {Fl32_Web_Back_Dto_Handler_Info.Dto}
         */
        const _info = dtoInfo.create();
        _info.name = this.constructor.name;
        _info.stage = STAGE.PROCESS;
        _info.before = ['Fl32_Web_Back_Handler_Static'];
        Object.freeze(_info);

        /** @type {string[]} */
        let _allowedLocales;

        /** @type {string} */
        let _defaultLocale;

        /** @type {boolean} */
        let _isInit = false;

        /** @type {boolean} */
        let _localeInUrl;

        /** @type {string} */
        let _rootPath;

        /**
         * @type {string}
         */
        const _INDEX = 'index.html';

        // FUNCS

        /**
         * Extracts locale from URL path if valid.
         * @param {string} urlPath
         * @param {string[]} allowedLocales
         * @param {string} defaultLocale
         * @returns {{ locale: string, cleanPath: string }}
         */
        function extractLocaleFromUrl(urlPath, allowedLocales = [], defaultLocale) {
            const trimmed = urlPath.replace(/^\/+|\/+$/g, '');
            const segments = trimmed.split('/');
            const first = segments[0];

            if (allowedLocales.includes(first)) {
                return {
                    locale: first,
                    cleanPath: '/' + segments.slice(1).join('/'),
                };
            } else {
                return {
                    locale: defaultLocale,
                    cleanPath: urlPath,
                };
            }
        }

        function extractTemplatePath(cleanPath) {
            let norm = cleanPath.replace(/^\/+|\/+$/g, '');
            if (norm === '') {
                return _INDEX;
            }
            if (cleanPath.endsWith('/')) {
                return `${norm}/${_INDEX}`;
            }
            return norm;
        }

        // MAIN

        /**
         * Handles request by serving template content.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} req
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} res
         * @returns {Promise<boolean>}
         */
        this.handle = async function (req, res) {
            if (!respond.isWritable(res)) return false;

            try {
                const {target, data, options} = await adapter.getRenderData({req});

                const {resultCode, template} = await servTmplLoad.perform({target});
                if (template) {
                    const {resultCode, content} = await servTmplRender.perform({
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
                } else {
                    return false;
                }
            } catch (e) {
                logger.exception(e);
                return false;
            }
        };

        /**
         * @returns {Fl32_Web_Back_Dto_Handler_Info.Dto}
         */
        this.getRegistrationInfo = () => _info;
    }
}