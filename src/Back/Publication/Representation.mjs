// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Representation
 * @description Selects publication representation independently of source priority.
 * @see https://github.com/flancer32/teq-cms/blob/main/ctx/docs/architecture/publication.md
 */
export default class Representation {
    /** Initializes the publication format selector. */
    constructor() {
        // Durable contract: ctx/docs/product/overview.md, Product Model.
        // Explicit suffix overrides headers; extensionless agent requests get Markdown,
        // human requests get HTML. Markdown authorship never implies a Markdown response.
        /**
         * @param {object} deps
         * @param {string} [deps.suffix]
         * @param {Record<string, string|string[]|undefined>} deps.headers
         * @returns {'md'|'html'|null}
         */
        this.select = ({suffix, headers}) => {
            if (suffix === 'md' || suffix === 'html') return suffix;
            const accept = typeof headers.accept === 'string' ? headers.accept : '';
            /** @type {Record<string, number>} */
            const quality = {};
            for (const entry of accept.toLowerCase().split(',')) {
                const [media, ...parameters] = entry.trim().split(';');
                const type = media.trim();
                if (!['text/markdown', 'text/html', 'application/xhtml+xml'].includes(type)) continue;
                const weight = parameters.map(value => value.trim()).find(value => value.startsWith('q='));
                const q = weight === undefined ? 1 : /^q=(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(weight) ? Number(weight.slice(2)) : 0;
                const key = type === 'text/markdown' ? 'md' : 'html';
                quality[key] = Math.max(quality[key] ?? 0, q);
            }
            const md = quality.md ?? 0;
            const html = quality.html ?? 0;
            if (md > html) return 'md';
            if (html > md) return 'html';
            if (quality.md === 0 && quality.html === 0) return null;
            if (quality.md === 0) return 'html';
            if (quality.html === 0) return 'md';
            // Wildcards, absent headers and equal explicit preferences do not identify a format.
            // This is a public delivery hint, not authentication or a privacy boundary.
            const ua = typeof headers['user-agent'] === 'string' ? headers['user-agent'] : '';
            const agent = /bot|crawler|spider|agent|chatgpt|claude|anthropic|curl\/|wget\/|python-requests|python-httpx|aiohttp|scrapy|libwww/i.test(ua);
            return agent ? 'md' : 'html';
        };
    }
}
