import {describe, it} from 'node:test';
import assert from 'assert';
import {buildTestContainer} from '../../../common.js';

/** Simple async generator producing streaming chunks */
function createStream(text) {
    return {
        async *[Symbol.asyncIterator]() {
            yield {choices: [{delta: {content: text}}]};
        },
    };
}

describe('Fl32_Cms_Back_Cli_Command_Translate.fetchFullCompletion', () => {
    const container = buildTestContainer();

    // Stubs for required deps
    container.register('Fl32_Cms_Back_Defaults$', {PROMPT_SYSTEM: ''});
    container.register('Fl32_Cms_Back_Logger$', {info: () => {}, error: () => {}, warn: () => {}});
    container.register('Fl32_Cms_Back_Config$', {getAiApiModel: () => 'm'});
    container.register('Fl32_Cms_Back_Gate_OpenAI$', {});
    container.register('Fl32_Cms_Back_Store_Db_Translate$', {});
    container.register('Fl32_Cms_Back_Helper_File$', {});
    container.register('Fl32_Cms_Back_Helper_Translate$', {});

    it('should request continuation when END marker absent', async () => {
        let call = 0;
        const client = {
            chat: {
                completions: {
                    create: async () => {
                        call++;
                        return call === 1
                            ? createStream('part1 ')
                            : createStream('part2 ---END FILE---');
                    },
                },
            },
        };
        container.register('Fl32_Cms_Back_Gate_OpenAI$', {initClient: async () => client});
        const cmd = await container.get('Fl32_Cms_Back_Cli_Command_Translate$');
        const messages = [{role: 'user', content: 'hello'}];
        const res = await cmd.__fetchFullCompletion({client, model: 'm', messages});
        assert.strictEqual(call, 2);
        assert.strictEqual(res, 'part1 part2 ---END FILE---');
    });
});
