/**
 * Resolves localized template file paths in the filesystem.
 */
export default class Fl32_Cms_Back_Helper_File {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:path')} path
     * @param {typeof import('node:fs')} fs
     * @param {Fl32_Cms_Back_Config} config
     */
    constructor(
        {
            'node:path': path,
            'node:fs': fs,
            Fl32_Cms_Back_Config$: config,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        const {join} = path;
        const {promises, constants} = fs;
        const {access, readFile, stat, writeFile} = promises;

        /**
         * Builds an absolute path to the localized template file.
         * @param {object} args
         * @param {string} args.locale - Target locale
         * @param {string} args.relPath - Relative path to the template
         * @returns {string} Absolute path
         */
        this.getLocalizedPath = function ({locale, relPath}) {
            const root = config.getRootPath();
            return join(root, 'tmpl', 'web', locale, relPath);
        };

        /**
         * Checks whether the given file exists.
         * @param {string} absPath
         * @returns {Promise<boolean>}
         */
        this.exists = async function (absPath) {
            try {
                await access(absPath, constants.F_OK);
                return true;
            } catch {
                return false;
            }
        };

        /**
         * Reads file content as UTF-8 string.
         * @param {string} absPath
         * @returns {Promise<string>}
         */
        this.readText = async function (absPath) {
            return readFile(absPath, 'utf-8');
        };

        /**
         * Returns file stats including mtime.
         * @param {string} absPath
         * @returns {Promise<import('node:fs').Stats>}
         */
        this.stat = async function (absPath) {
            return stat(absPath);
        };

        /**
         *
         * @param {string} absPath
         * @param {string} text
         * @returns {Promise<void>}
         */
        this.writeText = async function (absPath, text) {
            return writeFile(absPath, text, 'utf-8');
        };
    }
}