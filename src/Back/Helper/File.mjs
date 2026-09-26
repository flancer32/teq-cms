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
     */
    constructor(
        {
            path,
            fs,
        }
    ) {
        const {join} = path;
        const {promises, constants} = fs;
        const {access, stat} = promises;

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

    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        path: 'node:path',
        fs: 'node:fs',
    }),
});
