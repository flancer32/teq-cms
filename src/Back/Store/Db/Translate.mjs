// @ts-check

/**
 * @namespace Fl32_Cms_Back_Store_Db_Translate
 * @description File-backed translation metadata store.
 *
 * Manages translation metadata stored in a JSON file.
 * Handles loading, saving and querying translation modification times.
 */
export default class Fl32_Cms_Back_Store_Db_Translate {
    /**
     * @param {object} deps
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     * @param {TeqFw_Log_Provider} deps.logger
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     */
    constructor(
        {
            fs,
            path,
            logger,
            tmplConfig,
        }
    ) {

        // VAR
        /** @type {Record<string, Record<string, string>>} */
        let _data = {};
        const log = logger.forSource('Fl32_Cms_Back_Store_Db_Translate');

        /**
         * @returns {string} Absolute path to JSON file
         */
        const getFilePath = () => path.resolve(
            path.join(tmplConfig.getRootPath(), 'var', 'teq-cms', 'db_translate.json')
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
                log.info(`Loaded translations DB: ${FILE}`);
            } catch (err) {
                _data = {};
                const code = err instanceof Error && 'code' in err ? err.code : undefined;
                const message = err instanceof Error ? err.message : String(err);
                if (code === 'ENOENT') {
                    log.warn(`Translations DB not found, created empty: ${FILE}`);
                } else {
                    log.error(`Failed to load translations DB: ${message}`);
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
         * @param {string} pathRel - Relative path to the template file (e.g. "blog/about.html").
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
            log.info(`Saved translations DB: ${FILE}`);
        };

    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        fs: 'node:fs/promises',
        path: 'node:path',
        logger: 'TeqFw_Log_Provider$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
    }),
});
