// @ts-check

/**
 * @namespace Fl32_Cms_Back_Web_Handler_AgentMessage
 * @description Accepts bounded GET messages from agents for the site owner.
 * @implements TeqFw_Web_Back_Api_Handler
 */
export default class AgentMessage {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Config} deps.config
     * @param {Fl32_Cms_Back_Agent_Inbox} deps.inbox
     * @param {TeqFw_Web_Back_Dto_Info__Factory} deps.dtoInfo
     * @param {TeqFw_Web_Back_Enum_Stage} deps.STAGE
     * @param {TeqFw_Log_Provider} deps.logger
     */
    constructor({config, inbox, dtoInfo, STAGE, logger}) {
        const info = dtoInfo.create({
            name: 'Fl32_Cms_Back_Web_Handler_AgentMessage',
            stage: STAGE.PROCESS,
            before: ['Fl32_Cms_Back_Web_Handler_Template', 'TeqFw_Web_Back_Handler_Static'],
        });
        const log = logger.forSource('Fl32_Cms_Back_Web_Handler_AgentMessage');
        const agentId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
        const messageText = /^[\x20-\x7e]{1,4096}$/u;

        /** @returns {TeqFw_Web_Back_Dto_Info} */
        this.getRegistrationInfo = () => info;

        /** @param {TeqFw_Web_Back_Pipeline_RequestContext} context @returns {Promise<void>} */
        this.handle = async context => {
            const {request: req, response: res} = context;
            const rawUrl = req.url ?? '';
            if (rawUrl !== '/agent/message' && !rawUrl.startsWith('/agent/message?')) return;
            if (res.headersSent || res.writableEnded) return;
            /** @param {number} status @param {string} body @param {Record<string, string>} [extra] @returns {void} */
            const send = (status, body, extra = {}) => {
                res.writeHead(status, {
                    'cache-control': 'no-store',
                    'content-type': 'text/plain; charset=utf-8',
                    ...extra,
                });
                res.end(body);
                context.completed = true;
            };
            if (req.method !== 'GET') {
                send(405, 'Method Not Allowed', {allow: 'GET'});
                return;
            }
            if (rawUrl !== '/agent/message') {
                send(400, 'Message headers are required');
                return;
            }
            const agent = req.headers['x-agent-id'];
            const message = req.headers['x-agent-message'];
            const token = config.getAgentMessageToken();
            if (token && req.headers['x-agent-token'] !== token) {
                send(401, 'Unauthorized');
                return;
            }
            if (typeof agent !== 'string' || !agentId.test(agent) ||
                typeof message !== 'string' || !messageText.test(message)) {
                send(400, 'Invalid agent message');
                return;
            }
            try {
                await inbox.accept({agent, message});
                send(202, 'Accepted');
            } catch (error) {
                log.error('Agent message could not be stored.', {err: error});
                send(503, 'Message delivery unavailable');
            }
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        config: 'Fl32_Cms_Back_Config$',
        inbox: 'Fl32_Cms_Back_Agent_Inbox$',
        dtoInfo: 'TeqFw_Web_Back_Dto_Info__Factory$',
        STAGE: 'TeqFw_Web_Back_Enum_Stage$',
        logger: 'TeqFw_Log_Provider$',
    }),
});
