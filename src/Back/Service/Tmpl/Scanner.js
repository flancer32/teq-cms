/**
 * Scans the template directory and collects translation metadata for HTML files.
 */
export default class Fl32_Cms_Back_Service_Tmpl_Scanner {
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

        /**
         * Recursively scan directory and collect all .html files.
         * @param {string} dirAbs - Absolute directory path
         * @param {string} baseAbs - Absolute base directory to compute relative paths
         * @returns {Promise<Map<string, string>>} Map of relPath => ISO mtime
         */
        async function _scan(dirAbs, baseAbs) {
            const entries = await fs.readdir(dirAbs, {withFileTypes: true});
            const result = new Map();
            for (const entry of entries) {
                const absPath = path.join(dirAbs, entry.name);
                if (entry.isDirectory()) {
                    const sub = await _scan(absPath, baseAbs);
                    for (const [k, v] of sub) result.set(k, v);
                } else if (entry.isFile() && entry.name.endsWith('.html')) {
                    const stat = await fs.stat(absPath);
                    const relPath = path.relative(baseAbs, absPath).replace(/\\/g, '/');
                    result.set(relPath, stat.mtime.toISOString());
                }
            }
            return result;
        }

        /**
         * Scan templates for base locale and return structure for Translate DB.
         * @returns {Promise<object>} Structure: { relPath: { baseLocale: isoDate } }
         */
        this.scan = async function () {
            const baseLocale = config.getLocaleBaseTranslate();
            const root = config.getRootPath();
            const dir = path.join(root, 'tmpl', 'web', baseLocale);
            const abs = path.resolve(dir);
            const map = await _scan(abs, abs);
            const result = {};
            for (const [relPath, iso] of map.entries()) {
                result[relPath] = {[baseLocale]: iso};
            }
            logger.info(`Scanned ${map.size} template(s) in ${dir}`);
            return result;
        };
    }
}
