import {it} from 'node:test';
import assert from 'node:assert/strict';
import Handler from '../../../../../src/Back/Web/Handler/AgentMessage.mjs';

it('accepts bounded header messages and keeps response content private', async () => {
    const accepted = [];
    const handler = new Handler({
        config: {getAgentMessageToken: () => 'shared-secret'},
        inbox: {accept: async record => accepted.push(record)},
        dtoInfo: {create: value => value}, STAGE: {PROCESS: 'PROCESS'},
        logger: {forSource: () => ({error() {}})},
    });
    const send = async (url, method = 'GET', headers = {}) => {
        const response = {
            headersSent: false, writableEnded: false, status: undefined, headers: {}, body: '',
            writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; },
            end(body) { this.body = body; this.writableEnded = true; },
        };
        const context = {request: {url, method, headers}, response, completed: false};
        await handler.handle(context);
        return context;
    };
    assert.deepEqual(handler.getRegistrationInfo().before,
        ['Fl32_Cms_Back_Web_Handler_Template', 'TeqFw_Web_Back_Handler_Static']);
    const valid = await send('/agent/message', 'GET', {
        'x-agent-id': 'agent-1', 'x-agent-message': 'Please contact me', 'x-agent-token': 'shared-secret',
    });
    assert.equal(valid.response.status, 202);
    assert.equal(valid.completed, true);
    assert.equal(valid.response.body, 'Accepted');
    assert.deepEqual(accepted, [{agent: 'agent-1', message: 'Please contact me'}]);
    assert.equal((await send('/agent/message?message=secret')).response.status, 400);
    assert.equal((await send('/agent/message', 'POST')).response.status, 405);
    assert.equal((await send('/agent/message', 'GET', {'x-agent-token': 'shared-secret', 'x-agent-id': 'a', 'x-agent-message': 'bad\nline'})).response.status, 400);
    assert.equal((await send('/other')).completed, false);
    assert.equal(accepted.length, 1);
});
