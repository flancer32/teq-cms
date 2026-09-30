import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';

/** Parse sitemap XML with a real parser and reject all parser diagnostics. */
export function parseSitemap(xml) {
    const document = new DOMParser({onError: (level, message) => { throw new Error(`${level}: ${message}`); }})
        .parseFromString(xml, 'application/xml');
    const namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9';
    assert.equal(document.documentElement.localName, 'urlset');
    assert.equal(document.documentElement.namespaceURI, namespace);
    const entries = Array.from(document.getElementsByTagNameNS(namespace, 'url'));
    const urls = entries.map(entry => {
        const locations = entry.getElementsByTagNameNS(namespace, 'loc');
        assert.equal(locations.length, 1);
        const url = locations.item(0).textContent;
        assert.ok(['http:', 'https:'].includes(new URL(url).protocol));
        return url;
    });
    assert.equal(new Set(urls).size, urls.length);
    assert.deepEqual(urls, [...urls].sort());
    return urls;
}
