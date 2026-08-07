// @ts-check

/**
 * @namespace Fl32_Cms_Back_Gate_OpenAI
 * @description Thin OpenAI-compatible HTTP API gateway.
 */
export default class Fl32_Cms_Back_Gate_OpenAI {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Cms_Back_Platform_Fetch} deps.fetcher
     */
    constructor({config, fetcher}) {
        // VARS
        /**
         * @param {unknown} baseUrl
         * @returns {string|null}
         */
        const normalizeBaseUrl = function (baseUrl) {
            if (typeof baseUrl !== 'string' || !baseUrl) return null;
            return baseUrl.replace(/\/+$/u, '');
        };

        /**
         * @returns {Fl32_Cms_Back_Gate_OpenAI_Config}
         */
        const getConfig = function () {
            const baseUrl = normalizeBaseUrl(config.getAiApiBaseUrl());
            const apiKey = config.getAiApiKey();
            if (!baseUrl || !apiKey) {
                throw new Error('OpenAI API configuration is incomplete.');
            }
            return {baseUrl, apiKey};
        };

        /**
         * @param {Response} response
         * @returns {Promise<Error>}
         */
        const readError = async function (response) {
            let detail;
            if (typeof response?.text === 'function') {
                const text = await response.text();
                if (text) {
                    try {
                        detail = JSON.parse(text);
                    } catch {
                        detail = text;
                    }
                }
            }
            const status = response?.status ?? 0;
            const error = new Error(`OpenAI request failed with status ${status}.`);
            if (detail !== undefined) error.cause = detail;
            return error;
        };

        /**
         * @param {string} event
         * @returns {object|null}
         */
        const parseEvent = function (event) {
            const data = event
                .split(/\r?\n/u)
                .filter(line => line.startsWith('data:'))
                .map(line => line.slice(5).trimStart())
                .join('\n');
            if (!data || data === '[DONE]') return null;
            return JSON.parse(data);
        };

        // MAIN
        /**
         * Creates an async iterable from an OpenAI streaming response.
         * @param {Response} response
         * @returns {Promise<Fl32_Cms_Back_Gate_OpenAI_Stream>}
         */
        const readStream = async function (response) {
            /**
             * @returns {Promise<Fl32_Cms_Back_Gate_OpenAI_Stream>}
             */
            const stream = /** @type {() => Promise<Fl32_Cms_Back_Gate_OpenAI_Stream>} */ (/** @type {unknown} */ (async function* () {
                if (!response.body?.getReader) throw new Error('OpenAI streaming response has no body.');
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const {done, value} = await reader.read();
                    buffer += decoder.decode(value, {stream: !done});
                    const events = buffer.split(/\r?\n\r?\n/u);
                    buffer = events.pop() ?? '';
                    for (const event of events) {
                        const chunk = parseEvent(event);
                        if (chunk) yield chunk;
                    }
                    if (done) break;
                }
                if (buffer) {
                    const chunk = parseEvent(buffer);
                    if (chunk) yield chunk;
                }
            }));
            return stream();
        };

        /**
         * @param {object} deps - Request parameters.
         * @param {string} deps.model - Model name.
         * @param {object[]} deps.messages - Chat message history.
         * @returns {Promise<Fl32_Cms_Back_Gate_OpenAI_Stream>} Streaming response chunks.
         */
        this.createChatCompletion = async function ({model, messages}) {
            const {baseUrl, apiKey} = getConfig();
            /** @type {Record<string, string>} */
            const headers = {
                'content-type': 'application/json',
                authorization: `Bearer ${apiKey}`,
            };
            const organization = config.getAiApiOrganization();
            if (organization) headers['OpenAI-Organization'] = organization;
            const response = await fetcher.fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({model, messages, stream: true}),
            });
            if (!response?.ok) throw await readError(response);
            return readStream(response);
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        config: 'Fl32_Cms_Back_Config$',
        fetcher: 'Fl32_Cms_Back_Platform_Fetch$',
    }),
});
