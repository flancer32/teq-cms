/**
 * CMS localization and rendering configuration service.
 *
 * Holds global settings for locales, fallback locale, template engine, and application root path.
 * Must be initialized once during bootstrap.
 */
export default class Fl32_Cms_Back_Config {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {Fl32_Cms_Back_Helper_Cast} cast
     * @param {Fl32_Tmpl_Back_Config} configTmpl
     */
    constructor(
        {
            Fl32_Cms_Back_Helper_Cast$: cast,
            Fl32_Tmpl_Back_Config$: configTmpl,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */

        // VARS

        /** @type {string[]} Supported locale codes. */
        let _allowedLocales;

        /** @type {string} Fallback locale when no valid user locale found. */
        let _defaultLocale;

        /** @type {boolean} True if config initialized. */
        let _isInit = false;

        /** @type {string} Absolute path to application root. */
        let _rootPath;


        // MAIN

        /**
         * Initialize CMS localization and rendering settings.
         * Call once during startup to configure locales, fallback, root path and template engine.
         *
         * @param {object} config
         * @param {string[]} config.allowedLocales
         * @param {string} config.defaultLocale
         * @param {string} config.rootPath
         * @param {string} config.tmplEngine
         * @throws {Error} If initialized more than once
         */
        this.init = function ({allowedLocales, defaultLocale, rootPath, tmplEngine} = {}) {
            if (_isInit) {
                throw new Error('Fl32_Cms_Back_Config has already been initialized.');
            }

            _allowedLocales = cast.array(allowedLocales, cast.string);
            _defaultLocale = cast.string(defaultLocale);
            _rootPath = cast.string(rootPath);

            // configure the deps
            configTmpl.init({
                engine: tmplEngine,
                rootPath: _rootPath,
            });

            _isInit = true;
        };

        /**
         * @returns {string[]} Supported locales
         */
        this.getAllowedLocales = () => _allowedLocales;

        /**
         * @returns {string} Fallback locale
         */
        this.getDefaultLocale = () => _defaultLocale;

        /**
         * @returns {string} Application root path
         */
        this.getRootPath = () => _rootPath;

    }
}