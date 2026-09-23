import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {marked} from 'marked';
import {parseDocument} from 'yaml';
import Source from '../../../../src/Back/Publication/Source.mjs';

it('loads only a validated publication within its locale root', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-source-'));
    try {
        const file = path.join(root, 'tmpl/web/en/notes/a.md');
        await fs.mkdir(path.dirname(file), {recursive: true});
        await fs.writeFile(file, '---\ntitle: A\ndescription: About A\ndate: 2026-09-23\n---\n# Body\n');
        const source = new Source({
            fs, path, marked, parseDocument,
            tmplConfig: {getAvailableLocales: () => ['en', 'de'], getRootPath: () => root},
            config: {getPublicationFamilies: () => [{prefix: 'notes', presentation: 'page.html'}]},
        });
        const item = await source.read({locale: 'en', route: 'notes/a'});
        assert.equal(item.metadata.title, 'A');
        assert.equal(item.markdown, '# Body\n');
        assert.equal(item.html, '<h1>Body</h1>\n');
        assert.equal(await source.read({locale: 'de', route: 'notes/a'}), null);
        assert.equal(await source.read({locale: 'en', route: 'private/a'}), null);
        await assert.rejects(source.read({locale: 'en', route: 'notes/../a'}));
        await assert.rejects(source.read({locale: 'xx', route: 'notes/a'}));
        await fs.writeFile(file, '---\ntitle: A\ndescription: About A\ndate: 2026-02-31\n---\n# Body\n');
        await assert.rejects(source.read({locale: 'en', route: 'notes/a'}));
    } finally {
        await fs.rm(root, {recursive: true, force: true});
    }
});
