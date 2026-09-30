// @ts-check

/**
 * @namespace Fl32_Cms_Back_Discovery_Generator
 * @description Generates public discovery files from configured Markdown publications.
 */
export default class Generator {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Cms_Back_Publication_Routing} deps.routing
     * @param {Fl32_Cms_Back_Publication_Catalog} deps.catalog
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     */
    constructor({config, routing, catalog, tmplConfig, fs, path}) {
        /**
         * @returns {Promise<Fl32_Cms_Back_Discovery_Files>}
         */
        this.build = async () => {
            const rawBase = config.getBaseUrl();
            if (!rawBase) throw new Error('TEQ_CMS__BASE_URL is required for discovery generation.');
            const base = new URL(rawBase);
            if (!['http:', 'https:'].includes(base.protocol) || base.pathname !== '/' || base.search ||
                base.hash || base.username || base.password) {
                throw new Error('TEQ_CMS__BASE_URL must be an absolute HTTP URL without a path.');
            }
            const locales = tmplConfig.getAvailableLocales();
            const selection = config.getSitemapRepresentations();
            const inventory = await catalog.listRepresentations();
            const sitemapUrls = [...new Set(inventory
                .filter(resource => selection === 'both' || resource.representation === selection)
                .map(resource => new URL(resource.url, base).href))].sort();
            const markdownUrls = [...new Set((await catalog.listNeutral())
                .filter(item => item.metadata.indexable !== false)
                .map(item => new URL(routing.getMarkdownUrl({route: item.route}), base).href))].sort();
            const robots = `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', base).href}\n`;
            const llms = [
                '# Published Markdown',
                '',
                `Human locales: ${locales.join(', ')}`,
                '',
                ...markdownUrls.map(url => `- ${url}`),
                '',
            ].join('\n');
            /** @param {string} value @returns {string} */
            function escapeXml(value) {
                return value.replace(/[&<>"']/g,
                    char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'})[char] ?? char);
            }
            const sitemap = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                ...sitemapUrls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`),
                '</urlset>',
                '',
            ].join('\n');
            return {robots, llms, sitemap};
        };

        /** @returns {Promise<string[]>} */
        this.write = async () => {
            const content = await this.build();
            const root = path.resolve(tmplConfig.getRootPath());
            const directory = path.join(root, 'web');
            await fs.mkdir(directory, {recursive: true});
            if (!(await fs.lstat(directory)).isDirectory()) {
                throw new Error('The public web directory must be a real directory.');
            }
            const entries = [
                ['robots.txt', content.robots],
                ['llms.txt', content.llms],
                ['sitemap.xml', content.sitemap],
            ];
            for (const [name] of entries) {
                const file = path.join(directory, name);
                try {
                    if ((await fs.lstat(file)).isSymbolicLink()) {
                        throw new Error(`Refusing to replace symbolic link: ${file}`);
                    }
                } catch (error) {
                    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
                }
            }
            const files = entries.map(([name]) => path.join(directory, name));
            for (let index = 0; index < entries.length; index++) {
                await fs.writeFile(files[index], entries[index][1], 'utf8');
            }
            return files;
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        config: 'Fl32_Cms_Back_Config$',
        routing: 'Fl32_Cms_Back_Publication_Routing$',
        catalog: 'Fl32_Cms_Back_Publication_Catalog$',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        fs: 'node:fs/promises',
        path: 'node:path',
    }),
});
