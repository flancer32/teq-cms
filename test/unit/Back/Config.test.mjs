import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Config from '../../../src/Back/Config.mjs';

describe('Fl32_Cms_Back_Config', () => {
    it('projects and defaults typed CMS settings', () => {
        const config = new Config({
            cast: {
                string: value => typeof value === 'string' ? value : undefined,
            },
            reader: {
                get: namespace => {
                    assert.equal(namespace, 'TEQ_CMS');
                    return {BASE_URL: 'https://cms.test', AI_API_KEY: 'secret'};
                },
            },
        });

        assert.equal(config.getBaseUrl(), 'https://cms.test');
        assert.equal(config.getAiApiKey(), 'secret');
        assert.equal(config.getAiApiModel(), 'gpt-4o-mini');
        assert.equal(config.getLocaleBaseTranslate(), 'ru');
        assert.equal(config.getAiApiBaseUrl(), undefined);
        assert.equal(config.getAiApiOrganization(), undefined);
    });
});
