// @ts-check

/**
 * @namespace Fl32_Cms_Back_Helper_File
 * @description Localized template filesystem helper.
 *
 * Resolves localized template file paths in the filesystem.
 */
export default class Fl32_Cms_Back_Helper_File {
    /**
     * @param {object} deps
     * @param {typeof import('node:path')} deps.path
     * @param {typeof import('node:fs')} deps.fs
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     */
    constructor(
        {
            path,
            fs,
            tmplConfig,
        }
    ) {
        const {dirname, join} = path;
        const {promises, constants} = fs;
        const {access, mkdir, readFile, stat, writeFile} = promises;

        /**
         * Builds an absolute path to the localized template file.
         * @param {object} deps - Parameters object.
         * @param {string} deps.locale - Target locale
         * @param {string} deps.path - Relative path to the template
         * @returns {string} Absolute path
         */
        this.getLocalizedPath = function ({locale, path}) {
            const root = tmplConfig.getRootPath();
            return join(root, 'tmpl', 'web', locale, path);
        };

        /**
         * Checks whether the given file exists.
         * @param {object} deps - Parameters object.
         * @param {string} deps.path - Full path to the file
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
         * @param {object} deps - Parameters object.
         * @param {string} deps.path - Full path to the file
         * @returns {Promise<string>}
         */
        this.readText = async function ({path}) {
            return readFile(path, 'utf-8');
        };

        /**
         * Returns file stats including mtime.
         * @param {object} deps - Parameters object.
         * @param {string} deps.path - Full path to the file
         * @returns {Promise<object>}
         */
        this.stat = async function ({path}) {
            return stat(path);
        };

        /**
         * Replaces a file extension if it matches the expected one.
         * @param {object} deps - Parameters object.
         * @param {string} deps.path - Original file path
         * @param {string} deps.ext - New extension (e.g. '.prompt.md')
         * @param {string} [deps.fromExt='.html'] - Extension to be replaced
         * @returns {string} Updated file path
         */
        this.replaceExt = function ({path, ext, fromExt = '.html'}) {
            if (!path.endsWith(fromExt)) return path;
            return path.slice(0, -fromExt.length) + ext;
        };

        /**
         * Resolves a template name relative to a base directory.
         *
         * @param {object} deps - Parameters object.
         * @param {string} deps.baseDir - Directory used as base for resolution
         * @param {string} deps.cleanPath - Clean path extracted from URL
         * @returns {Promise<string|undefined>} Resolved template name or undefined
         */
        this.resolveTemplateName = async function ({baseDir, cleanPath}) {
            const trimmed = (cleanPath ?? '').replace(/^\/+|\/+$/g, '');

            try {
                const fullPath = join(baseDir, trimmed);
                await access(fullPath, constants.R_OK);
                const statRes = await stat(fullPath);
                if (statRes.isFile()) return trimmed;
            } catch {}

            const indexVariant = join(trimmed, 'index.html');
            try {
                const fullPath = join(baseDir, indexVariant);
                await access(fullPath, constants.R_OK);
                const statRes = await stat(fullPath);
                if (statRes.isFile()) return indexVariant;
            } catch {}

            const htmlVariant = trimmed ? `${trimmed}.html` : 'index.html';
            try {
                const fullPath = join(baseDir, htmlVariant);
                await access(fullPath, constants.R_OK);
                const statRes = await stat(fullPath);
                if (statRes.isFile()) return htmlVariant;
            } catch {}

            return undefined;
        };

        /**
         * Writes UTF-8 string to file.
         * @param {object} deps - Parameters object.
         * @param {string} deps.path - Full path to the file
         * @param {string} deps.text - Content to write
         * @returns {Promise<void>}
         */
        this.writeText = async function ({path, text}) {
            const dir = dirname(path);
            await mkdir(dir, {recursive: true});
            return writeFile(path, text, 'utf-8');
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        path: 'node:path',
        fs: 'node:fs',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
    }),
});
