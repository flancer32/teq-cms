// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Translate
 * @description Protects Markdown syntax while translating publication prose.
 */
export default class Fl32_Cms_Back_Publication_Translate {
    /**
     * @param {object} deps
     * @param {typeof import('yaml').parseDocument} deps.parseDocument
     * @param {typeof import('marked').marked} deps.marked
     */
    constructor({parseDocument, marked}) {
        const translatable = ['title', 'description', 'summary', 'displayDate', 'imageAlt'];

        /** @param {Array<*>} tokens @returns {Array<object>} */
        const structure = tokens => tokens.flatMap(token => {
            if (token.type === 'text' || token.type === 'escape' || token.type === 'space') return [];
            return [{
                type: token.type,
                depth: token.depth,
                ordered: token.ordered,
                start: token.start,
                href: token.href,
                lang: token.lang,
                tokens: token.tokens ? structure(token.tokens) : undefined,
                items: token.items ? token.items.map(/** @param {*} item */ item => structure(item.tokens ?? [])) : undefined,
                headerCount: token.header?.length,
                rowCount: token.rows?.length,
                rowLengths: token.rows?.map(/** @param {*} row */ row => row.length),
            }];
        });

        /**
         * @param {Fl32_Cms_Back_Publication_Item} item
         * @returns {object}
         */
        this.prepare = function (item) {
            if (item.source.includes('[[TEQCMS_')) throw new Error('Reserved Markdown translation marker in source.');
            /** @type {string[]} */
            const protectedParts = [];
            /** @param {string} part @returns {string} */
            const protect = part => {
                const token = `[[TEQCMS_${String(protectedParts.length).padStart(5, '0')}]]`;
                protectedParts.push(part);
                return token;
            };
            const lines = item.markdown.split('\n');
            let fence = '';
            let htmlClose = '';
            const masked = lines.map(line => {
                const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
                if (fence) {
                    if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = '';
                    return protect(line);
                }
                if (fenceMatch) {
                    fence = fenceMatch[1];
                    return protect(line);
                }
                if (htmlClose) {
                    if (line.includes(htmlClose) || !line.trim()) htmlClose = '';
                    return protect(line);
                }
                if (/^\s{0,3}<(?:!--|[A-Za-z][\w-]*(?:\s|>))/.test(line)) {
                    const tag = /^\s{0,3}<([A-Za-z][\w-]*)/.exec(line)?.[1];
                    htmlClose = tag ? `</${tag}>` : '-->';
                    if (line.includes(htmlClose)) htmlClose = '';
                    return protect(line);
                }
                if (/^\s{0,3}\[[^\]]+\]:\s*\S/.test(line) ||
                    /^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*\|?\s*$/.test(line)) return protect(line);
                if (/^\s{0,3}(?:[-*_]\s*){3,}$/.test(line) || /^ {4}/.test(line)) return protect(line);
                const prefix = /^(\s*(?:(?:#{1,6}|>|[-*+]|\d+[.)])\s+)+)/.exec(line);
                let text = prefix ? protect(prefix[1]) + line.slice(prefix[1].length) : line;
                text = text.replace(/`+[^`\n]*`+|!?\[[^\]\n]*\]\([^\)\n]*\)|<[^>\n]+>|https?:\/\/[^\s<>)]+|\*\*|__|~~|(?<!\w)[*_](?!\s)|(?<=\S)[*_](?!\w)/g,
                    match => {
                        const link = /^(!?\[[^\]]*\]\()([^)]*)(\))$/.exec(match);
                        if (link) return `${link[1]}${protect(link[2])}${link[3]}`;
                        return protect(match);
                    });
                return text;
            }).join('\n');
            const fields = Object.fromEntries(translatable.filter(key =>
                typeof item.metadata[key] === 'string').map(key => [key, item.metadata[key]]));
            const payload = JSON.stringify({fields, body: masked});

            /** @param {string} answer @returns {string} */
            const complete = answer => {
                const result = JSON.parse(answer);
                if (!result || typeof result !== 'object' || typeof result.body !== 'string' ||
                    !result.fields || typeof result.fields !== 'object' ||
                    Object.keys(result.fields).sort().join('|') !== Object.keys(fields).sort().join('|') ||
                    Object.keys(fields).some(key => typeof result.fields[key] !== 'string' || !result.fields[key].trim())) {
                    throw new Error('Markdown translation has invalid shape.');
                }
                const expected = protectedParts.map((_, index) => `[[TEQCMS_${String(index).padStart(5, '0')}]]`);
                const actual = result.body.match(/\[\[TEQCMS_\d{5}\]\]/g) ?? [];
                if (actual.join('|') !== expected.join('|')) throw new Error('Markdown translation altered protected syntax.');
                let body = result.body;
                expected.forEach((token, index) => { body = body.replace(token, protectedParts[index]); });
                if (JSON.stringify(structure(marked.lexer(body))) !==
                    JSON.stringify(structure(marked.lexer(item.markdown)))) {
                    throw new Error('Markdown translation altered document structure.');
                }
                const front = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(item.source);
                if (!front) throw new Error('Publication front matter is missing.');
                const document = parseDocument(front[1], {uniqueKeys: true, strict: true});
                if (document.errors.length) throw new Error('Publication front matter is invalid.');
                for (const key of Object.keys(fields)) document.set(key, result.fields[key]);
                return `---\n${document.toString()}---\n${body}`;
            };
            return {payload, complete};
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        parseDocument: 'npm:yaml__parseDocument',
        marked: 'npm:marked__marked',
    }),
});
