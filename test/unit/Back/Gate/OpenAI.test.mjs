import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import OpenAIGate from '../../../../src/Back/Gate/OpenAI.mjs';

describe('Fl32_Cms_Back_Gate_OpenAI', () => {
    it('creates the client from typed CMS settings', async () => {
        let options;
        class OpenAI {
            constructor(value) {
                options = value;
            }
        }

        const gate = new OpenAIGate({
            openai: {default: OpenAI},
            config: {
                getAiApiKey: () => 'key',
                getAiApiBaseUrl: () => 'https://api.test',
                getAiApiOrganization: () => 'org',
            },
        });

        assert.ok(await gate.initClient() instanceof OpenAI);
        assert.deepEqual(options, {
            baseURL: 'https://api.test',
            apiKey: 'key',
            organization: 'org',
        });
    });
});
