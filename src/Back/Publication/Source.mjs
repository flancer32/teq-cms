// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Source
 * @description Reads policy-selected public Markdown publications from the application template tree.
 */
export default class Fl32_Cms_Back_Publication_Source {
    /**
     * @param {object} deps
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Cms_Back_Publication_Routing} deps.routing
     * @param {Fl32_Cms_Back_Publication_Policy} deps.policy
     * @param {typeof import('yaml').parseDocument} deps.parseDocument
     * @param {typeof import('marked').marked} deps.marked
     */
    constructor({fs, path, tmplConfig, routing, policy, parseDocument, marked}) {
        const locales = tmplConfig.getAvailableLocales();
        /** @type {Fl32_Cms_Back_Publication_Family[]} */
        const families = routing.getFamilies();
        const root = path.resolve(tmplConfig.getRootPath(), 'tmpl', 'web');
        /** @param {unknown} route @returns {boolean} */
        const safeRoute = route => typeof route === 'string' &&
            /^(?:[a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_-]+)*$/.test(route);

        /** @param {string} route @returns {Fl32_Cms_Back_Publication_Family|undefined} */
        this.getFamily = route => families.find(family =>
            (family.prefix === '' || route.startsWith(`${family.prefix}/`)) && safeRoute(route) && routing.isPublicRoute(route)
        );

        /**
         * Treat unreadable or invalid variants as unavailable public representations.
         * Strict callers can use read() to diagnose the underlying failure.
         * @param {object} deps
         * @param {string} deps.locale
         * @param {string} deps.route
         * @returns {Promise<Fl32_Cms_Back_Publication_Item|null>}
         */
        this.readAvailable = async ({locale, route}) => {
            try {
                return await this.read({locale, route});
            } catch {
                return null;
            }
        };

        /**
         * Select the canonical Markdown source using the site's maintained locales.
         * @param {object} deps
         * @param {string} deps.route
         * @returns {Promise<Fl32_Cms_Back_Publication_Item|null>}
         */
        this.readNeutral = async ({route}) => {
            if (!this.getFamily(route)) return null;
            const candidates = new Set([...(routing.isSite() ? [''] : []), 'en', tmplConfig.getDefaultLocale()]);
            for (const locale of candidates) {
                if (locale === undefined || (locale !== '' && !locales.includes(locale))) continue;
                if (routing.isSite()) {
                    try {
                        await fs.lstat(path.join(root, locale, `${route}.md`));
                    } catch (error) {
                        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
                        return null;
                    }
                    return this.readAvailable({locale, route});
                }
                const item = await this.readAvailable({locale, route});
                if (item) return item;
            }
            return null;
        };

        /**
         * Detect an authored route even when its source is invalid or a symlink.
         * @param {object} deps
         * @param {string} deps.route
         * @returns {Promise<boolean>}
         */
        this.hasRoute = async ({route}) => {
            if (!this.getFamily(route)) return false;
            for (const locale of [...(routing.isSite() ? [''] : []), ...locales]) {
                try {
                    await fs.lstat(path.join(root, locale, `${route}.md`));
                    return true;
                } catch (error) {
                    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) return true;
                }
            }
            return false;
        };

        /**
         * @param {object} deps
         * @param {string} deps.locale
         * @param {string} deps.route
         * @returns {Promise<Fl32_Cms_Back_Publication_Item|null>}
         */
        this.read = async ({locale, route}) => {
            if ((locale === '' ? !routing.isSite() : !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(locale) ||
                !locales.includes(locale)) || !safeRoute(route)) {
                throw new Error('Invalid publication locale or route.');
            }
            let family = this.getFamily(route);
            if (!family) return null;
            if (routing.isSite()) {
                const presentation = policy.getPresentationName({route, locale});
                if (typeof presentation !== 'string' || !presentation.endsWith('.html') || !safeRoute(presentation.slice(0, -5))) {
                    throw new Error('Invalid publication presentation name.');
                }
                family = {...family, presentation};
            }
            const base = path.join(root, locale);
            const file = path.resolve(base, `${route}.md`);
            if (!file.startsWith(`${base}${path.sep}`)) throw new Error('Publication path escapes source root.');
            let realFile;
            try {
                const realRoot = await fs.realpath(root);
                const realLocale = await fs.realpath(base);
                realFile = await fs.realpath(file);
                if (realLocale !== path.join(realRoot, locale) ||
                    realFile !== path.join(realLocale, `${route}.md`)) {
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
        routing: 'Fl32_Cms_Back_Publication_Routing$',
        policy: 'Fl32_Cms_Back_Publication_Policy$',
        parseDocument: 'npm:yaml__parseDocument',
        marked: 'npm:marked__marked',
    }),
});
