import {it} from 'node:test';
import assert from 'node:assert/strict';
import Handler from '../../src/Back/Web/Handler/AgentMessage.mjs';
import Plugin from '../../src/Back/Cli/Plugin.mjs';
import Pipeline from '../../node_modules/@teqfw/web/src/Back/PipelineEngine.mjs';
import Kahn from '../../node_modules/@teqfw/web/src/Back/Helper/Order/Kahn.mjs';
import Respond from '../../node_modules/@teqfw/web/src/Back/Helper/Respond.mjs';
import http2 from 'node:http2';
import path from 'node:path';

it('accepts an agent message through the CMS web pipeline before page handlers', async () => {
    const STAGE = {INIT: 'INIT', PROCESS: 'PROCESS', FINALIZE: 'FINALIZE'};
    const logger = {forSource: () => ({error() {}, info() {}})};
    const respond = new Respond({http2});
    const accepted = [];
    const config = {
        getPublicationFamilies: () => [],
        getAgentMessageEnabled: () => true,
        getAgentMessageToken: () => undefined,
    };
    const handAgentMessage = new Handler({
        config, inbox: {accept: async record => accepted.push(record)},
        dtoInfo: {create: value => value}, STAGE, logger,
    });
    const pipeline = new Pipeline({
        dtoRequestContextFactory: {create: () => ({})}, logger, respond, helpOrder: new Kahn(), STAGE,
    });
    const plugin = new Plugin({
        pipeline, config, handAgentMessage,
        handLog: {getRegistrationInfo: () => ({name: 'log', stage: STAGE.INIT}), handle: async () => {}},
        handStatic: {init: async () => {}, getRegistrationInfo: () =>
            ({name: 'TeqFw_Web_Back_Handler_Static', stage: STAGE.PROCESS}), handle: async () => {}},
        handTmpl: {getRegistrationInfo: () =>
            ({name: 'Fl32_Cms_Back_Web_Handler_Template', stage: STAGE.PROCESS}), handle: async () => {}},
        handPublication: {}, dtoSource: {create: value => value},
        tmplConfig: {getRootPath: () => '/application'}, path,
    });
    await plugin.onStartup();
    pipeline.lockHandlers();
    const response = {
        headersSent: false, writableEnded: false, status: undefined, body: '',
        writeHead(status) { this.status = status; this.headersSent = true; },
        end(body) { this.body = body; this.writableEnded = true; },
    };
    await pipeline.onEventRequest({
        url: '/agent/message', method: 'GET',
        headers: {'x-agent-id': 'agent-1', 'x-agent-message': 'Hello owner'},
    }, response);
    assert.equal(response.status, 202);
    assert.equal(response.body, 'Accepted');
    assert.deepEqual(accepted, [{agent: 'agent-1', message: 'Hello owner'}]);
});
