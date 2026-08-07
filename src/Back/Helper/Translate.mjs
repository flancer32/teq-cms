// @ts-check

/**
 * @namespace Fl32_Cms_Back_Helper_Translate
 * @description Translation metadata synchronization helper.
 *
 * Provides utilities for syncing translation metadata with the actual template files.
 */
export default class Fl32_Cms_Back_Helper_Translate {
    /**
     * @param {object} deps
     * @param {typeof import('node:path')} deps.path
     * @param {typeof import('node:fs')} deps.fs
     * @param {TeqFw_Log_Provider} deps.logger
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Config} deps.config
     */
    constructor(
        {
            path,
            fs,
            logger,
            tmplConfig,
            config,
        }
    ) {
        const {join, relative, resolve} = path;
        const {promises} = fs;
        const {readdir, stat, access, constants} = promises;
        const log = logger.forSource('Fl32_Cms_Back_Helper_Translate');

        /**
         * Synchronizes translation DB state with HTML templates from disk.
         * @param {Fl32_Cms_Back_Store_Db_Translate} db - Translation DB store
         * @returns {Promise<void>}
         */
        this.syncDbWithFilesystem = async function (db) {
            const baseLocale = config.getLocaleBaseTranslate();
            const root = tmplConfig.getRootPath();
            const dir = join(root, 'tmpl', 'web', baseLocale);
            const abs = resolve(dir);
            const allowedExt = '.html';

            // Check if base directory exists
            try {
                await access(abs, constants.F_OK);
            } catch {
                log.warn(`Base locale directory not found: ${abs}`);
                return;
            }

            // Internal recursive scan
            /**
             * @param {string} dirAbs
             * @param {string} baseAbs
             * @returns {Promise<Fl32_Cms_Back_Helper_Translate_Scan>}
             */
            async function scan(dirAbs, baseAbs) {
                const entries = await readdir(dirAbs, {withFileTypes: true});
                /** @type {Map<string, string>} */
                const result = new Map();
                for (const entry of entries) {
                    const absPath = join(dirAbs, entry.name);
                    if (entry.isDirectory()) {
                        const sub = await scan(absPath, baseAbs);
                        for (const [k, v] of sub) result.set(k, v);
                    } else if (entry.isFile() && entry.name.endsWith(allowedExt)) {
                        const statData = await stat(absPath);
                        const relPath = relative(baseAbs, absPath).replace(/\\/g, '/');
                        result.set(relPath, statData.mtime.toISOString());
                    }
                }
                return result;
            }

            const scanned = await scan(abs, abs); // Map<relPath, ISODate>
            const scannedPaths = new Set(scanned.keys());
            const existingPaths = new Set(Object.keys(db.getData()));

            for (const relPath of scannedPaths) {
                const newMtime = scanned.get(relPath);
                const oldMtime = db.getMtime(relPath, baseLocale);
                if (!oldMtime || oldMtime !== newMtime) {
                    db.setMtime(relPath, baseLocale, newMtime);
                    log.info(`Updated timestamp for: ${relPath}`);
                }
            }

            for (const relPath of existingPaths) {
                if (!scannedPaths.has(relPath)) {
                    db.remove(relPath);
                    log.info(`Removed obsolete entry: ${relPath}`);
                }
            }

            log.info(`Translation DB synchronized with ${scannedPaths.size} template(s).`);
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        path: 'node:path',
        fs: 'node:fs',
        logger: 'TeqFw_Log_Provider$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        config: 'Fl32_Cms_Back_Config$',
    }),
});
