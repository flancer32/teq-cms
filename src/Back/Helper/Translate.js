/**
 * Provides utilities for syncing translation metadata with the actual template files.
 */
export default class Fl32_Cms_Back_Helper_Translate {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:path')} path
     * @param {typeof import('node:fs')} fs
     * @param {Fl32_Cms_Back_Logger} logger
     * @param {Fl32_Cms_Back_Config} config
     */
    constructor(
        {
            'node:path': path,
            'node:fs': fs,
            Fl32_Cms_Back_Logger$: logger,
            Fl32_Cms_Back_Config$: config,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        const {join, relative, resolve} = path;
        const {promises} = fs;
        const {readdir, stat, access, constants} = promises;

        /**
         * Synchronizes translation DB state with HTML templates from disk.
         * @param {Fl32_Cms_Back_Store_Db_Translate} db - Translation DB store
         * @returns {Promise<void>}
         */
        this.syncDbWithFilesystem = async function (db) {
            const baseLocale = config.getLocaleBaseTranslate();
            const root = config.getRootPath();
            const dir = join(root, 'tmpl', 'web', baseLocale);
            const abs = resolve(dir);
            const allowedExt = '.html';

            // Check if base directory exists
            try {
                await access(abs, constants.F_OK);
            } catch {
                logger.warn(`Base locale directory not found: ${abs}`);
                return;
            }

            // Internal recursive scan
            async function scan(dirAbs, baseAbs) {
                const entries = await readdir(dirAbs, {withFileTypes: true});
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
                    logger.info(`Updated timestamp for: ${relPath}`);
                }
            }

            for (const relPath of existingPaths) {
                if (!scannedPaths.has(relPath)) {
                    db.remove(relPath);
                    logger.info(`Removed obsolete entry: ${relPath}`);
                }
            }

            logger.info(`Translation DB synchronized with ${scannedPaths.size} template(s).`);
        };
    }
}
