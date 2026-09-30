import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Config from '../../../src/Back/Config.mjs';

describe('Fl32_Cms_Back_Config', () => {
    it('projects and defaults typed CMS settings', () => {
        const config = new Config({
            tmplConfig: {getAvailableLocales: () => ['en', 'de', 'ru']},
            cast: {
                string: value => typeof value === 'string' ? value : undefined,
                bool: value => value === true || value === 'true' ? true : value === false || value === 'false' ? false : undefined,
            },
            reader: {
                get: namespace => {
                    assert.equal(namespace, 'TEQ_CMS');
                    return {BASE_URL: 'https://cms.test'};
                },
            },
        });

        assert.equal(config.getBaseUrl(), 'https://cms.test');
        assert.equal(config.getSitemapRepresentations(), 'html');
        assert.equal(config.getAgentMessageEnabled(), false);
        assert.equal(config.getAgentMessageToken(), undefined);
        assert.deepEqual(config.getPublicationFamilies(), []);
    });

    it('projects explicit publication families and rejects ambiguous prefixes', () => {
        const make = raw => new Config({
            tmplConfig: {getAvailableLocales: () => ['en', 'de', 'ru']},
            cast: {
                string: value => typeof value === 'string' ? value : undefined,
                bool: value => value === true || value === 'true' ? true : value === false || value === 'false' ? false : undefined,
            },
            reader: {get: () => raw},
        });
        const config = make({
            PUBLICATION_FAMILIES: JSON.stringify([{prefix: 'journal', presentation: 'pages/article.html'}]),
            AGENT_MESSAGE_ENABLED: 'true',
            AGENT_MESSAGE_TOKEN: 'shared-secret',
        });
        assert.deepEqual(config.getPublicationFamilies(), [{prefix: 'journal', presentation: 'pages/article.html'}]);
        assert.equal(config.getAgentMessageEnabled(), true);
        assert.equal(config.getAgentMessageToken(), 'shared-secret');
        assert.throws(() => make({PUBLICATION_FAMILIES: [{prefix: '../private', presentation: 'page.html'}]}));
        assert.throws(() => make({PUBLICATION_FAMILIES: [
            {prefix: 'journal', presentation: 'page.html'},
            {prefix: 'journal/long', presentation: 'page.html'},
        ]}));
        for (const prefix of ['en', 'ru/docs', 'de/stories/longform']) {
            assert.throws(() => make({PUBLICATION_FAMILIES: [
                {prefix: 'docs', presentation: 'page.html'}, {prefix, presentation: 'page.html'},
            ]}), /must not begin with a maintained locale/);
        }
        assert.deepEqual(make({PUBLICATION_FAMILIES: [
            {prefix: 'docs', presentation: 'page.html'},
            {prefix: 'stories/longform', presentation: 'page.html'},
        ]}).getPublicationFamilies().map(item => item.prefix), ['docs', 'stories/longform']);
        // Obsolete keys are not projected or validated as CMS settings.
        const obsolete = make({PUBLICATION_MACHINE_LOCALES: '../en'});
        assert.equal('getPublicationMachineLocales' in obsolete, false);
        assert.deepEqual(obsolete.getPublicationFamilies(), []);
    });
});

it('validates sitemap representation selection without coercing invalid settings', () => {
    const make = value => new Config({cast: {string: v => v, bool: () => undefined},
        tmplConfig: {getAvailableLocales: () => []}, reader: {get: () => ({SITEMAP_REPRESENTATIONS: value})}});
    for (const value of ['html', 'markdown', 'both']) assert.equal(make(value).getSitemapRepresentations(), value);
    for (const value of ['', 'HTML', 'md', 'all', false, ['html']]) assert.throws(() => make(value), /SITEMAP_REPRESENTATIONS/);
});
