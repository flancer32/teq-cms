/**
 * CMS localization, rendering, and AI API configuration service.
 * Holds global settings for locales, template engine, and OpenAI-compatible API parameters.
 * Must be initialized once during application bootstrap.
 */
export default class Fl32_Cms_Back_Config {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {Fl32_Cms_Back_Helper_Cast} cast - Type casting helper
     * @param {Fl32_Tmpl_Back_Config} configTmpl - Template engine configuration
     * @param {Fl32_Web_Back_Server_Config} serverConfigFactory
     */
    constructor(
        {
            Fl32_Cms_Back_Helper_Cast$: cast,
            Fl32_Tmpl_Back_Config$: configTmpl,
            Fl32_Web_Back_Server_Config$: serverConfigFactory,
        }
    ) {
        /* eslint-enable jsdoc/check-param-names */

        // VARS

        /**
         * Base URL of the OpenAI-compatible API.
         * Example: https://api.openai.com/v1 or https://api.deepseek.com/v1
         * @type {string}
         */
        let _aiApiBaseUrl;

        /**
         * API key for OpenAI-compatible provider.
         * Should be kept secret and provided via environment variables.
         * @type {string}
         */
        let _aiApiKey;

        /**
         * Name of the AI model to use.
         * Example: gpt-4, gpt-4o, deepseek-chat
         * @type {string}
         */
        let _aiApiModel;

        /**
         * Optional organization ID (used by OpenAI).
         * Can be null for other providers.
         * @type {string|null}
         */
        let _aiApiOrg;

        /**
         * Indicates whether the configuration has already been initialized.
         * Prevents reinitialization.
         * @type {boolean}
         */
        let _isInit = false;

        /**
         * Supported locale codes.
         * Example: ['en', 'ru']
         * @type {string[]}
         */
        let _localeAllowed;

        /**
         * Base locale for internal translation workflows.
         * Used as a source language for AI localization.
         * @type {string}
         */
        let _localeBaseTranslate;

        /**
         * Base locale for rendering static web content.
         * Example: 'en' or 'ru'
         * @type {string}
         */
        let _localeBaseWeb;

        /**
         * Absolute path to the application root directory.
         * Used as a base for resolving content and template paths.
         * @type {string}
         */
        let _rootPath;

        /**
         * DTO with web server configuration built from provided parameters.
         * @type {Fl32_Web_Back_Server_Config.Dto}
         */
        let _webConfigDto;


        // MAIN

        /**
         * Initialize CMS localization, rendering, and AI API settings.
         *
         * @param {object} args - Configuration arguments
         * @param {string} args.aiApiBaseUrl - API base URL
         * @param {string} args.aiApiKey - Secret API key
         * @param {string} args.aiApiModel - Model name
         * @param {string} [args.aiApiOrg] - Optional organization ID
         * @param {string[]} args.localeAllowed - Supported locale codes
         * @param {string} args.localeBaseTranslate - Source locale for translation
         * @param {string} args.localeBaseWeb - Default locale for rendering
         * @param {string} args.rootPath - Application root directory
         * @param {string} args.tmplEngine - Template engine name
         * @param {number} args.serverPort - Web server port
         * @param {string} args.serverType - Type of the web server
         * @param {string} args.tlsCert - Path to TLS certificate
         * @param {string} args.tlsKey - Path to TLS private key
         * @param {string} [args.tlsCa] - Optional path to TLS CA certificate
         * @throws {Error} If initialized more than once
         */
        this.init = function (args) {
            if (_isInit) {
                throw new Error('Fl32_Cms_Back_Config has already been initialized.');
            }

            const {
                aiApiBaseUrl,
                aiApiKey,
                aiApiModel,
                aiApiOrg,
                localeAllowed,
                localeBaseTranslate,
                localeBaseWeb,
                rootPath,
                tmplEngine,
                serverPort,
                serverType,
                tlsCert,
                tlsKey,
                tlsCa,
            } = args;

            _aiApiBaseUrl = cast.string(aiApiBaseUrl);
            _aiApiKey = cast.string(aiApiKey);
            _aiApiModel = cast.string(aiApiModel);
            _aiApiOrg = aiApiOrg ? cast.string(aiApiOrg) : null;
            _localeAllowed = cast.array(localeAllowed, cast.string);
            _localeBaseTranslate = cast.string(localeBaseTranslate);
            _localeBaseWeb = cast.string(localeBaseWeb);
            _rootPath = cast.string(rootPath);

            configTmpl.init({
                allowedLocales: _localeAllowed,
                defaultLocale: _localeBaseWeb,
                engine: tmplEngine,
                rootPath: _rootPath,
            });

            const port = cast.int(serverPort);
            const type = cast.string(serverType);
            const cert = cast.string(tlsCert);
            const key = cast.string(tlsKey);
            const ca = cast.string(tlsCa);

            _webConfigDto = serverConfigFactory.create({
                port,
                type,
                tls: cert && key ? {cert, key, ca} : undefined,
            });

            _isInit = true;
        };


        // GETTERS

        /**
         * @returns {string} API base URL
         */
        this.getAiApiBaseUrl = () => _aiApiBaseUrl;

        /**
         * @returns {string} Secret API key
         */
        this.getAiApiKey = () => _aiApiKey;

        /**
         * @returns {string} AI model name
         */
        this.getAiApiModel = () => _aiApiModel;

        /**
         * @returns {string|null} Optional organization ID
         */
        this.getAiApiOrg = () => _aiApiOrg;

        /**
         * @returns {string[]} Supported locale codes
         */
        this.getLocaleAllowed = () => _localeAllowed;

        /**
         * @returns {string} Default locale for translation.
         */
        this.getLocaleBaseTranslate = () => _localeBaseTranslate;

        /**
         * @returns {string} Default locale for rendering
         */
        this.getLocaleBaseWeb = () => _localeBaseWeb;

        /**
         * @returns {string} Absolute application root path
         */
        this.getRootPath = () => _rootPath;

        /**
         * @returns {Fl32_Web_Back_Server_Config.Dto}
         */
        this.getWebServerConfigDto = () => _webConfigDto;
    }
}
