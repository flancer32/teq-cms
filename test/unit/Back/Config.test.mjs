import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Config from '../../../src/Back/Config.mjs';

describe('Fl32_Cms_Back_Config', () => {
    it('projects and defaults typed CMS settings', () => {
        const config = new Config({
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
        assert.equal(config.getAgentMessageEnabled(), false);
        assert.equal(config.getAgentMessageToken(), undefined);
        assert.deepEqual(config.getPublicationFamilies(), []);
        assert.deepEqual(config.getPublicationMachineLocales(), []);
    });

    it('projects explicit publication families and rejects ambiguous prefixes', () => {
        const make = raw => new Config({
            cast: {
                string: value => typeof value === 'string' ? value : undefined,
                bool: value => value === true || value === 'true' ? true : value === false || value === 'false' ? false : undefined,
            },
            reader: {get: () => raw},
        });
        const config = make({
            PUBLICATION_FAMILIES: JSON.stringify([{prefix: 'journal', presentation: 'pages/article.html'}]),
            PUBLICATION_MACHINE_LOCALES: 'en,ru',
            AGENT_MESSAGE_ENABLED: 'true',
            AGENT_MESSAGE_TOKEN: 'shared-secret',
        });
        assert.deepEqual(config.getPublicationFamilies(), [{prefix: 'journal', presentation: 'pages/article.html'}]);
        assert.deepEqual(config.getPublicationMachineLocales(), ['en', 'ru']);
        assert.equal(config.getAgentMessageEnabled(), true);
        assert.equal(config.getAgentMessageToken(), 'shared-secret');
        assert.throws(() => make({PUBLICATION_FAMILIES: [{prefix: '../private', presentation: 'page.html'}]}));
        assert.throws(() => make({PUBLICATION_FAMILIES: [
            {prefix: 'journal', presentation: 'page.html'},
            {prefix: 'journal/long', presentation: 'page.html'},
        ]}));
        assert.throws(() => make({PUBLICATION_MACHINE_LOCALES: '../en'}));
    });
});
