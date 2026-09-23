// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Catalog
 * @description Deterministic catalog of opted-in Markdown publications.
 */
export default class Fl32_Cms_Back_Publication_Catalog {
    /**
     * @param {object} deps
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Cms_Back_Publication_Source} deps.source
     */
    constructor({fs, path, tmplConfig, config, source}) {
        const root = path.resolve(tmplConfig.getRootPath(), 'tmpl', 'web');

        /**
         * Enumerate a locale's opted-in publications with validated metadata.
         * @param {object} deps
         * @param {string} deps.locale
         * @returns {Promise<Fl32_Cms_Back_Publication_Item[]>}
         */
        this.list = async ({locale}) => {
            if (!/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(locale) ||
                !tmplConfig.getAvailableLocales().includes(locale)) throw new Error('Invalid publication locale.');
            let realLocale;
            try {
                const realRoot = await fs.realpath(root);
                realLocale = await fs.realpath(path.join(root, locale));
                if (realLocale !== path.join(realRoot, locale)) throw new Error('Publication locale escapes source root.');
            } catch (error) {
                if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return [];
                throw error;
            }
            /** @type {Fl32_Cms_Back_Publication_Item[]} */
            const publications = [];
            for (const family of config.getPublicationFamilies()) {
                const directory = path.join(root, locale, family.prefix);
                let realDirectory;
                try {
                    realDirectory = await fs.realpath(directory);
                    if (realDirectory !== path.join(realLocale, family.prefix)) {
                        throw new Error('Publication family escapes locale root.');
                    }
                } catch (error) {
                    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
                    throw error;
                }
                /** @param {string} dir @returns {Promise<void>} */
                const scan = async dir => {
                    let entries;
                    try {
                        entries = await fs.readdir(dir, {withFileTypes: true});
                    } catch (error) {
                        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return;
                        throw error;
                    }
                    for (const entry of entries) {
                        if (entry.isSymbolicLink()) continue;
                        const file = path.join(dir, entry.name);
                        if (entry.isDirectory() && /^[A-Za-z0-9_-]+$/.test(entry.name)) {
                            await scan(file);
                        } else if (entry.isFile() && /^[A-Za-z0-9_-]+\.md$/.test(entry.name)) {
                            const route = path.relative(realLocale, file).replaceAll(path.sep, '/').slice(0, -3);
                            const publication = await source.read({locale, route});
                            if (publication) publications.push(publication);
                        }
                    }
                };
                await scan(realDirectory);
            }
            return publications.sort((a, b) => a.route < b.route ? -1 : a.route > b.route ? 1 : 0);
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        fs: 'node:fs/promises',
        path: 'node:path',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        config: 'Fl32_Cms_Back_Config$',
        source: 'Fl32_Cms_Back_Publication_Source$',
    }),
});
