import {describe, it} from 'node:test';
import assert from 'assert';
import {buildTestContainer} from '../../../common.js';
import TranslateCommand from '../../../../../src/Back/Cli/Command/Translate.mjs';

/** Simple async generator producing streaming chunks */
function createStream(text) {
    return {
        async* [Symbol.asyncIterator]() {
            yield {choices: [{delta: {content: text}}]};
        },
    };
}

describe('Fl32_Cms_Back_Cli_Command_Translate.fetchFullCompletion', () => {
    const container = buildTestContainer();

    // Stubs for required deps
    container.register('Fl32_Cms_Back_Defaults$', {PROMPT_SYSTEM: ''});
    container.register('TeqFw_Log_Provider$', {forSource: () => ({info: () => {}, error: () => {}, warn: () => {}})});
    container.register('TeqFw_Cfg_Reader$', {
        get: (namespace) => namespace === 'TEQFW_TMPL'
            ? {ALLOWED_LOCALES: ['en'], DEFAULT_LOCALE: 'en', ROOT_PATH: process.cwd()}
            : {AI_API_MODEL: 'm'},
    });
    container.register('Fl32_Cms_Back_Config$', {
        getAiApiModel: () => 'm',
        getLocaleBaseTranslate: () => 'en',
    });
    container.register('Fl32_Cms_Back_Store_Db_Translate$', {});
    container.register('Fl32_Cms_Back_Helper_File$', {});
    container.register('Fl32_Cms_Back_Helper_Translate$', {});

    it('should request continuation when END marker absent', async () => {
        let call = 0;
        const client = {
            createChatCompletion: async () => {
                call++;
                return call === 1
                    ? createStream('part1 ')
                    : createStream('part2 ---END FILE---');
            },
        };
        const cmd = await container.get('Fl32_Cms_Back_Cli_Command_Translate$');
        const messages = [{role: 'user', content: 'hello'}];
        const res = await cmd.__fetchFullCompletion({client, model: 'm', messages});
        assert.strictEqual(call, 2);
        assert.strictEqual(res, 'part1 part2 ---END FILE---');
    });
});

describe('Fl32_Cms_Back_Cli_Command_Translate.execute', () => {
    it('translates changed templates and records the result', async () => {
        const writes = [];
        const mtimes = {};
        const db = {
            data: {'about.html': {}},
            async init() {},
            async save() {},
            getData() { return this.data; },
            getMtime(path, locale) { return this.data[path]?.[locale] ?? null; },
            setMtime(path, locale, value) {
                if (!this.data[path]) this.data[path] = {};
                this.data[path][locale] = value;
                mtimes[`${path}:${locale}`] = value;
            },
        };
        const helpFile = {
            getLocalizedPath: ({locale, path}) => `/tmpl/${locale}/${path}`,
            stat: async () => ({mtime: new Date('2026-01-01T00:00:00.000Z')}),
            readText: async ({path}) => path.endsWith('.prompt.md') ? 'Keep the heading.' : '<h1>Hello</h1>',
            exists: async ({path}) => path.endsWith('.prompt.md'),
            replaceExt: ({path, ext}) => path.replace('.html', ext),
            writeText: async value => writes.push(value),
        };
        const command = new TranslateCommand({
            DEF: {PROMPT_SYSTEM: 'Translate.'},
            logger: {forSource: () => ({info: () => {}, error: () => {}})},
            config: {getLocaleBaseTranslate: () => 'en', getAiApiModel: () => 'model'},
            tmplConfig: {getAvailableLocales: () => ['en', 'ru']},
            gateOpenAI: {
                createChatCompletion: async () => createStream(
                    ['---FILE: about.html---', '<h1>Привет</h1>', '---END FILE---'].join(String.fromCharCode(10)),
                ),
            },
            dbTranslate: db,
            helpTranslate: {syncDbWithFilesystem: async () => {}},
            helpFile,
        });

        await command.execute({});

        assert.deepEqual(writes, [{path: '/tmpl/ru/about.html', text: '<h1>Привет</h1>'}]);
        assert.equal(mtimes['about.html:en'], '2026-01-01T00:00:00.000Z');
        assert.match(mtimes['about.html:ru'], /^2026-/);
    });
});
