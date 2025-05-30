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
        const {dirname, join} = path;
        const {promises, constants} = fs;
        const {access, mkdir, readFile, stat, writeFile} = promises;

        /**
         * Builds an absolute path to the localized template file.
         * @param {object} args
         * @param {string} args.locale - Target locale
         * @param {string} args.path - Relative path to the template
         * @returns {string} Absolute path
         */
        this.getLocalizedPath = function ({locale, path}) {
            const root = config.getRootPath();
            return join(root, 'tmpl', 'web', locale, path);
        };

        /**
         * Checks whether the given file exists.
         * @param {object} args
         * @param {string} args.path - Full path to the file
         * @returns {Promise<boolean>}
         */
        this.exists = async function ({path}) {
            try {
                await access(path, constants.F_OK);
                return true;
            } catch {
                return false;
            }
        };

        /**
         * Reads file content as UTF-8 string.
         * @param {object} args
         * @param {string} args.path - Full path to the file
         * @returns {Promise<string>}
         */
        this.readText = async function ({path}) {
            return readFile(path, 'utf-8');
        };

        /**
         * Returns file stats including mtime.
         * @param {object} args
         * @param {string} args.path - Full path to the file
         * @returns {Promise<import('node:fs').Stats>}
         */
        this.stat = async function ({path}) {
            return stat(path);
        };

        /**
         * Replaces a file extension if it matches the expected one.
         * @param {object} args
         * @param {string} args.path - Original file path
         * @param {string} args.ext - New extension (e.g. '.prompt.md')
         * @param {string} [args.fromExt='.html'] - Extension to be replaced
         * @returns {string} Updated file path
         */
        this.replaceExt = function ({path, ext, fromExt = '.html'}) {
            if (!path.endsWith(fromExt)) return path;
            return path.slice(0, -fromExt.length) + ext;
        };

        /**
         * Writes UTF-8 string to file.
         * @param {object} args
         * @param {string} args.path - Full path to the file
         * @param {string} args.text - Content to write
         * @returns {Promise<void>}
         */
        this.writeText = async function ({path, text}) {
            const dir = dirname(path);
            await mkdir(dir, {recursive: true});
            return writeFile(path, text, 'utf-8');
        };
    }
}
