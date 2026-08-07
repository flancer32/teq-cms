import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import OpenAIGate from '../../../../src/Back/Gate/OpenAI.mjs';

const streamResponse = function (events) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(events.join('\n\n')));
            controller.close();
        },
    });
    return {ok: true, status: 200, body};
};

describe('Fl32_Cms_Back_Gate_OpenAI', () => {
    it('posts a streaming chat completion to the configured endpoint', async () => {
        let request;
        const gate = new OpenAIGate({
            fetcher: {fetch: async (url, options) => {
                request = {url, options};
                return streamResponse([
                    'data: {"choices":[{"delta":{"content":"Hello"}}]}',
                    'data: [DONE]',
                ]);
            }},
            config: {
                getAiApiKey: () => 'key',
                getAiApiBaseUrl: () => 'https://api.test/v1/',
                getAiApiModel: () => 'model',
                getAiApiOrganization: () => 'org',
            },
        });

        const stream = await gate.createChatCompletion({
            model: 'model',
            messages: [{role: 'user', content: 'Hello'}],
        });
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);

        assert.equal(request.url, 'https://api.test/v1/chat/completions');
        assert.equal(request.options.method, 'POST');
        assert.equal(request.options.headers.authorization, 'Bearer key');
        assert.equal(request.options.headers['OpenAI-Organization'], 'org');
        assert.deepEqual(JSON.parse(request.options.body), {
            model: 'model',
            messages: [{role: 'user', content: 'Hello'}],
            stream: true,
        });
        assert.deepEqual(chunks, [{choices: [{delta: {content: 'Hello'}}]}]);
    });

    it('reports HTTP errors and keeps the API error payload as cause', async () => {
        const gate = new OpenAIGate({
            fetcher: {fetch: async () => ({
                ok: false,
                status: 401,
                async text() { return JSON.stringify({error: {message: 'Unauthorized'}}); },
            })},
            config: {
                getAiApiKey: () => 'key',
                getAiApiBaseUrl: () => 'https://api.test/v1',
                getAiApiOrganization: () => undefined,
            },
        });

        await assert.rejects(
            () => gate.createChatCompletion({model: 'model', messages: []}),
            error => error.message === 'OpenAI request failed with status 401.'
                && error.cause.error.message === 'Unauthorized'
        );
    });
});
