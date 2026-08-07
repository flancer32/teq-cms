import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {buildTestContainer} from '../common.js';

async function waitListening(server) {
    if (!server.getInstance().listening) {
        await new Promise(res => server.getInstance().once('listening', res));
    }
}

describe('Fl32_Cms_Back_Cli_Command_Web', () => {
    it('should start web server with ./web static root', async () => {
        const container = buildTestContainer();
        const cmd = await container.get('Fl32_Cms_Back_Cli_Command_Web$');
        const server = await container.get('Fl32_Web_Back_Server$');
        const http = await container.get('node:http');

        const controller = new AbortController();
        const runtime = await cmd.start({signal: controller.signal});
        await waitListening(server);

        const status = await new Promise((resolve, reject) => {
            http.get(`http://localhost:3050/raw.html`, res => {
                const {statusCode} = res;
                res.resume();
                res.on('end', () => resolve(statusCode));
            }).on('error', reject);
        });

        assert.strictEqual(status, 200);
        controller.abort();
        await runtime.done;
        await runtime.stop();
    });
});
