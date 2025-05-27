/**
 * Manages translation metadata stored in a JSON file.
 * Handles loading, saving and querying translation modification times.
 */
export default class Fl32_Cms_Back_Store_Db_Translate {
    /* eslint-disable jsdoc/require-param-description, jsdoc/check-param-names */
    /**
     * @param {typeof import('node:fs/promises')} fs
     * @param {typeof import('node:path')} path
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     */
    constructor(
        {
            'node:fs/promises': fs,
            'node:path': path,
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description, jsdoc/check-param-names */

        // VAR
        let _data = {};

        /**
         * @returns {string} Absolute path to JSON file
         */
        const getFilePath = () => path.resolve(
            path.join(config.getRootPath(), 'var', 'teq-cms', 'db_translate.json')
        );

        /**
         * Loads or initializes translation data from the JSON file.
         * @returns {Promise<void>}
         */
        this.init = async function () {
            const FILE = getFilePath();
            try {
                const json = await fs.readFile(FILE, 'utf-8');
                _data = JSON.parse(json);
                logger.info(`Loaded translations DB: ${FILE}`);
            } catch (err) {
                _data = {};
                if (err.code === 'ENOENT') {
                    logger.warn(`Translations DB not found, created empty: ${FILE}`);
                } else {
                    logger.error(`Failed to load translations DB: ${err.message}`);
                }
            }
        };

        /**
         * Gets last modification time for a file in specified locale.
         * @param {string} pathRel - Relative file path
         * @param {string} locale - Target locale
         * @returns {string|null} - ISO date string or null if not found
         */
        this.getMtime = function (pathRel, locale) {
            return _data?.[pathRel]?.[locale] || null;
        };

        /**
         * Sets last modification time for a file in specified locale.
         * @param {string} pathRel - Relative file path
         * @param {string} locale - Target locale
         * @param {string} isoDate - ISO date string
         */
        this.setMtime = function (pathRel, locale, isoDate) {
            if (!_data[pathRel]) _data[pathRel] = {};
            _data[pathRel][locale] = isoDate;
        };

        /**
         * Removes entry by a relative path.
         * @param {string} pathRel
         */
        this.remove = function (pathRel) {
            delete _data[pathRel];
        };

        /**
         * @returns {object} Raw internal data
         */
        this.getData = function () {
            return _data;
        };

        /**
         * Gets all locales with translations for a file.
         * @param {string} pathRel - Relative file path
         * @returns {string[]} - Array of locale codes
         */
        this.getLocales = function (pathRel) {
            return Object.keys(_data?.[pathRel] || {});
        };

        /**
         * Saves current translation data to disk.
         * @returns {Promise<void>}
         */
        this.save = async function () {
            const FILE = getFilePath();
            await fs.mkdir(path.dirname(FILE), {recursive: true});
            const json = JSON.stringify(_data, null, 2);
            await fs.writeFile(FILE, json, 'utf-8');
            logger.info(`Saved translations DB: ${FILE}`);
        };
    }
}
