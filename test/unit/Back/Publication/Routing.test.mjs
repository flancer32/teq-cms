import {it} from 'node:test';
import assert from 'node:assert/strict';
import Routing from '../../../../src/Back/Publication/Routing.mjs';

const make = (mode = 'site', prefixes = ['/assets/'], families = []) => new Routing({
    policy: {getMode: () => mode, getStaticPrefixes: () => prefixes},
    config: {getPublicationFamilies: () => families},
    tmplConfig: {getAvailableLocales: () => ['en', 'de']},
});

it('validates policy combinations and static prefixes', () => {
    assert.throws(() => make('other'), /mode/);
    assert.throws(() => make('site', [], [{prefix: 'docs'}]), /cannot be combined/);
    for (const prefix of ['/', 'assets/', '/assets', '/assets/../private/', '/assets//', '/%61ssets/']) {
        assert.throws(() => make('site', [prefix]), /Static prefixes/);
    }
});

it('preserves segment boundaries and shares static exclusions with the public corpus', () => {
    const routing = make();
    for (const path of ['/assets', '/assets/a.md', '/robots.txt', '/llms.txt', '/sitemap.xml']) assert.equal(routing.isStatic(path), true);
    assert.equal(routing.isStatic('/assets-other/a'), false);
    for (const route of ['assets/a', 'agent/message', 'en/about', '../private', 'a.prompt']) assert.equal(routing.isPublicRoute(route), false);
    assert.equal(routing.isPublicRoute('about'), true);
    assert.equal(routing.isPublicRoute('docs/nested/page'), true);
    assert.equal(routing.getUrl({route: 'index'}), '/');
    assert.equal(routing.getMarkdownUrl({route: 'index'}), '/index.md');
    assert.equal(routing.getMarkdownUrl({route: 'docs/page'}), '/docs/page.md');
    assert.equal(routing.getUrl({route: 'index', locale: 'en'}), '/en/');
    assert.equal(routing.getUrl({route: 'docs/index', locale: 'en'}), '/en/docs/index');
    assert.equal(make('families').getUrl({route: 'docs/index'}), '/docs/index');
});
