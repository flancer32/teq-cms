/**
 * CMS localization settings configuration service.
 * Must be initialized once during application bootstrap.
 */
export default class Fl32_Cms_Back_Config {
    /* eslint-disable jsdoc/require-param-description */
    /**
     * @param {Fl32_Cms_Back_Helper_Cast} cast
     */
    constructor(
        {
            Fl32_Cms_Back_Helper_Cast$: cast,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description */

        // VARS
        /** @type {string[]} Allowed locale identifiers. */
        let _allowedLocales;

        /** @type {string} Default locale identifier. */
        let _defaultLocale;

        /** @type {boolean} Initialization state flag. */
        let _isInit = false;

        /** @type {boolean} Whether locale should be included in URLs. */
        let _localeInUrl;

        /** @type {string} Application root directory. */
        let _rootPath;

        // MAIN
        /**
         * Initialize configuration with localization settings.
         * @param {object} config - Configuration parameters.
         * @param {string[]} config.allowedLocales - Allowed locale identifiers.
         * @param {string} config.defaultLocale - Default locale identifier.
         * @param {boolean} config.localeInUrl - Whether to include locale in URLs.
         * @param {string} config.rootPath - Absolute path to application root.
         * @throws {Error} When called more than once.
         */
        this.init = function ({allowedLocales, defaultLocale, localeInUrl, rootPath} = {}) {
            if (_isInit) {
                throw new Error('Fl32_Cms_Back_Config has already been initialized.');
            }

            _allowedLocales = cast.array(allowedLocales, cast.string);
            _defaultLocale = cast.string(defaultLocale);
            _localeInUrl = cast.bool(localeInUrl);
            _rootPath = cast.string(rootPath);

            _isInit = true;
        };

        /**
         * @returns {string[]} All allowed locales.
         */
        this.getAllowedLocales = () => _allowedLocales;

        /**
         * @returns {string} Current default locale.
         */
        this.getDefaultLocale = () => _defaultLocale;

        /**
         * @returns {string} Application root directory.
         */
        this.getRootPath = () => _rootPath;

        /**
         * @returns {boolean} Whether locale is included in URLs.
         */
        this.isLocaleInUrl = () => _localeInUrl;
    }
}
