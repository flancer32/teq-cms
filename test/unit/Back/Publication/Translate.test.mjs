import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {parseDocument} from 'yaml';
import {marked} from 'marked';
import Translate from '../../../../src/Back/Publication/Translate.mjs';

describe('Markdown publication translation', () => {
    it('translates prose and selected metadata while preserving authored structure', () => {
        const source = [
            '---',
            'title: A story',
            'description: Story description',
            'date: 2026-09-23',
            'relationId: entry-42',
            'image: https://example.test/image.png',
            '---',
            '# Hello [friend](https://example.test/read)',
            '',
            'See `getValue()` and ![A picture](https://example.test/picture.png).',
            'Bare https://example.test/bare and [a reference][source].',
            '',
            '[source]: https://example.test/source',
            '',
            '```js',
            'const greeting = "Hello";',
            '```',
            '',
            '<div class="note">',
            'Raw HTML',
            '</div>',
            '',
        ].join('\n');
        const item = {
            source,
            markdown: source.slice(source.indexOf('---\n', 4) + 4),
            metadata: {
                title: 'A story', description: 'Story description', date: '2026-09-23',
                relationId: 'entry-42', image: 'https://example.test/image.png',
            },
        };
        const job = new Translate({parseDocument, marked}).prepare(item);
        const payload = JSON.parse(job.payload);
        assert.deepEqual(Object.keys(payload.fields), ['title', 'description']);
        assert.doesNotMatch(payload.body, /const greeting|https:\/\/example\.test\/read/);
        const result = job.complete(JSON.stringify({
            fields: {title: 'Eine Geschichte', description: 'Beschreibung'},
            body: payload.body.replace('Hello', 'Hallo').replace('friend', 'Freund')
                .replace('See', 'Siehe').replace('A picture', 'Ein Bild').replace('Bare', 'Direkt'),
        }));
        assert.match(result, /title: Eine Geschichte/);
        assert.match(result, /date: 2026-09-23/);
        assert.match(result, /relationId: entry-42/);
        assert.match(result, /# Hallo \[Freund\]\(https:\/\/example\.test\/read\)/);
        assert.match(result, /`getValue\(\)`/);
        assert.match(result, /!\[Ein Bild\]\(https:\/\/example\.test\/picture\.png\)/);
        assert.match(result, /https:\/\/example\.test\/bare/);
        assert.match(result, /\[source\]: https:\/\/example\.test\/source/);
        assert.match(result, /const greeting = "Hello";/);
        assert.match(result, /<div class="note">\nRaw HTML\n<\/div>/);
        assert.throws(() => job.complete(JSON.stringify({
            fields: {title: 'Eine Geschichte', description: 'Beschreibung'},
            body: payload.body.replace(/\[\[TEQCMS_\d{5}\]\]/, ''),
        })), /protected syntax/);
    });
});
