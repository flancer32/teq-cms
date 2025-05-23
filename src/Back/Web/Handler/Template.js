/**
 * CMS template handler for web requests.
 * @implements Fl32_Web_Back_Api_Handler
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
     * @param {Fl32_Tmpl_Back_Service_Render} servTmplRender
     * @param {Fl32_Cms_Back_Helper_Cast} cast
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
            Fl32_Tmpl_Back_Service_Render$: servTmplRender,
            Fl32_Cms_Back_Helper_Cast$: cast,
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
         * Handler registration info.
         * @type {Fl32_Web_Back_Dto_Handler_Info.Dto}
         */
        const _info = dtoInfo.create();
        _info.name = this.constructor.name;
        _info.stage = STAGE.PROCESS;
        _info.before = ['Fl32_Web_Back_Handler_Static'];
        Object.freeze(_info);

        /** @type {string[]} Supported locale codes. */
        let _allowedLocales;

        /** @type {string} Fallback locale. */
        let _defaultLocale;

        /** @type {boolean} Initialization flag. */
        let _isInit = false;

        /** @type {boolean} Whether URL contains locale segment. */
        let _localeInUrl;

        /** @type {string} Application root directory path. */
        let _rootPath;

        /**
         * Default filenames for directory requests.
         * @type {string[]}
         */
        const _defaultFiles = ['index.html', 'index.htm', 'index.txt'];

        // FUNCS

        /**
         * Extracts locale from URL path if valid.
         * @param {string} urlPath - Decoded URL path.
         * @param {string[]} allowedLocales - Supported locales.
         * @param {string} defaultLocale - Fallback locale.
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

        // MAIN

        /**
         * Handles request by serving template content.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} req
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} res
         * @returns {Promise<boolean>} True if handled successfully.
         */
        this.handle = async function (req, res) {
            if (!respond.isWritable(res)) return false;

            try {
                const urlPath = decodeURIComponent(req.url.split('?')[0]);
                let locale = _defaultLocale;
                let cleanPath = urlPath;

                if (_localeInUrl) {
                    const parsed = extractLocaleFromUrl(urlPath, _allowedLocales, _defaultLocale);
                    locale = parsed.locale;
                    cleanPath = parsed.cleanPath;
                }

                const {resultCode, content} = await servTmplRender.perform({
                    type: 'web',
                    name: cleanPath,
                    locales: {user: locale, app: _defaultLocale},
                });

                if (content) {
                    const bodyBuffer = Buffer.from(content, 'utf-8');
                    const headers = {
                        [HTTP2_HEADER_CONTENT_ENCODING]: 'utf-8',
                        [HTTP2_HEADER_CONTENT_LENGTH]: bodyBuffer.length,
                    };
                    respond.code200_Ok({res, headers, body: content});
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                logger.exception(e);
                return false;
            }
        };

        /**
         * Initializes handler with configuration.
         * @param {object} args - Configuration.
         * @param {string[]} args.allowedLocales - Supported locales.
         * @param {string} args.defaultLocale - Fallback locale.
         * @param {boolean} args.localeInUrl - Whether URL contains locale.
         * @param {string} args.rootPath - Application root path.
         * @throws {Error} If already initialized.
         * @returns {Promise<void>}
         */
        this.init = async function ({allowedLocales, defaultLocale, localeInUrl, rootPath}) {
            if (_isInit) {
                throw new Error('Fl32_Cms_Back_Config has already been initialized.');
            }

            _allowedLocales = cast.array(allowedLocales, cast.string);
            _defaultLocale = cast.string(defaultLocale);
            _localeInUrl = cast.bool(localeInUrl);
            _rootPath = path.resolve(cast.string(rootPath));
            actTmplFind.init({root: _rootPath});

            _isInit = true;
            logger.info(`CMS files root: ${path.join(_rootPath, 'tmpl')}`);
        };

        /**
         * Returns handler registration info.
         * @returns {Fl32_Web_Back_Dto_Handler_Info.Dto}
         */
        this.getRegistrationInfo = () => _info;
    }
}