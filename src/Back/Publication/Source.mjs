// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Source
 * @description Reads opted-in Markdown publications from the application template tree.
 */
export default class Fl32_Cms_Back_Publication_Source {
    /**
     * @param {object} deps
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {typeof import('yaml').parseDocument} deps.parseDocument
     * @param {typeof import('marked').marked} deps.marked
     */
    constructor({fs, path, tmplConfig, config, parseDocument, marked}) {
        const locales = tmplConfig.getAvailableLocales();
        /** @type {Fl32_Cms_Back_Publication_Family[]} */
        const families = config.getPublicationFamilies();
        const root = path.resolve(tmplConfig.getRootPath(), 'tmpl', 'web');
        /** @param {unknown} route @returns {boolean} */
        const safeRoute = route => typeof route === 'string' &&
            /^(?:[a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_-]+)*$/.test(route);

        /** @param {string} route @returns {Fl32_Cms_Back_Publication_Family|undefined} */
        this.getFamily = route => families.find(family =>
            route.startsWith(`${family.prefix}/`) && safeRoute(route)
        );

        /**
         * @param {object} deps
         * @param {string} deps.locale
         * @param {string} deps.route
         * @returns {Promise<Fl32_Cms_Back_Publication_Item|null>}
         */
        this.read = async ({locale, route}) => {
            if (!/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(locale) ||
                !locales.includes(locale) || !safeRoute(route)) {
                throw new Error('Invalid publication locale or route.');
            }
            const family = this.getFamily(route);
            if (!family) return null;
            const base = path.join(root, locale);
            const file = path.resolve(base, `${route}.md`);
            if (!file.startsWith(`${base}${path.sep}`)) throw new Error('Publication path escapes source root.');
            let realFile;
            try {
                const realRoot = await fs.realpath(root);
                const realLocale = await fs.realpath(base);
                realFile = await fs.realpath(file);
                if (realLocale !== path.join(realRoot, locale) ||
                    !realFile.startsWith(`${path.join(realLocale, family.prefix)}${path.sep}`)) {
                    throw new Error('Publication path escapes source root.');
                }
            } catch (error) {
                if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return null;
                throw error;
            }
            const source = await fs.readFile(realFile, 'utf8');
            const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
            if (!match) throw new Error('Publication front matter is missing or malformed.');
            const document = parseDocument(match[1], {uniqueKeys: true, strict: true});
            if (document.errors.length) throw new Error('Publication front matter is invalid.');
            const metadata = document.toJS();
            if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
                throw new Error('Publication front matter must be a mapping.');
            }
            if (typeof metadata.title !== 'string' || !metadata.title.trim() ||
                typeof metadata.description !== 'string' || !metadata.description.trim() ||
                typeof metadata.date !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(metadata.date) ||
                new Date(`${metadata.date}T00:00:00Z`).toISOString().slice(0, 10) !== metadata.date) {
                throw new Error('Publication requires title, description and ISO date.');
            }
            const markdown = match[2];
            const html = marked.parse(markdown, {async: false});
            return {locale, route, family, source, metadata, markdown, html};
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        fs: 'node:fs/promises',
        path: 'node:path',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        config: 'Fl32_Cms_Back_Config$',
        parseDocument: 'npm:yaml__parseDocument',
        marked: 'npm:marked__marked',
    }),
});
