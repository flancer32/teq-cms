import {describe, it} from 'node:test';
import assert from 'assert';
import {buildTestContainer} from '../../../../support/unit.js';
import TranslateCommand from '../../../../../src/Back/Cli/Command/Translate.mjs';
import PublicationTranslate from '../../../../../src/Back/Publication/Translate.mjs';
import {parseDocument} from 'yaml';
import {marked} from 'marked';

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
        getPublicationFamilies: () => [],
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

        assert.equal(command.id, 'cms:translate');

        await command.execute({});

        assert.deepEqual(writes, [{path: '/tmpl/ru/about.html', text: '<h1>Привет</h1>'}]);
        assert.equal(mtimes['about.html:en'], '2026-01-01T00:00:00.000Z');
        assert.match(mtimes['about.html:ru'], /^2026-/);
    });

    it('writes structurally validated Markdown in a translated locale', async () => {
        const source = '---\ntitle: Hello\ndescription: A greeting\ndate: 2026-09-23\n---\n# Hello `code`\n';
        const writes = [];
        const checked = [];
        const errors = [];
        let badAnswer = false;
        const data = {'journal/hello.md': {}};
        const dbTranslate = {
            async init() {}, async save() {}, getData: () => data,
            getMtime: (path, locale) => data[path]?.[locale] ?? null,
            setMtime: (path, locale, value) => { data[path][locale] = value; },
        };
        const helpFile = {
            getLocalizedPath: ({locale, path}) => `/tmpl/${locale}/${path}`,
            stat: async () => ({mtime: new Date('2026-09-23T00:00:00Z')}),
            readText: async () => source,
            exists: async ({path}) => { checked.push(path); return false; },
            replaceExt: ({path, ext, fromExt = '.html'}) => path.slice(0, -fromExt.length) + ext,
            writeText: async value => writes.push(value),
        };
        const command = new TranslateCommand({
            DEF: {PROMPT_SYSTEM: 'HTML translation'},
            logger: {forSource: () => ({info() {}, error: value => errors.push(value)})},
            config: {getLocaleBaseTranslate: () => 'en', getAiApiModel: () => 'model'},
            tmplConfig: {getAvailableLocales: () => ['en', 'de']},
            dbTranslate, helpFile, helpTranslate: {syncDbWithFilesystem: async () => {}},
            pubSource: {read: async () => ({source, markdown: '# Hello `code`\n', metadata: {
                title: 'Hello', description: 'A greeting', date: '2026-09-23',
            }})},
            pubTranslate: new PublicationTranslate({parseDocument, marked}),
            gateOpenAI: {createChatCompletion: async ({messages}) => {
                if (badAnswer) return createStream('invalid ---END FILE---');
                const payload = JSON.parse(messages.at(-1).content);
                const output = JSON.stringify({
                    fields: {title: 'Hallo', description: 'Ein Gruß'},
                    body: payload.body.replace('Hello', 'Hallo'),
                });
                return createStream(`---FILE: journal/hello.md---\n${output}\n---END FILE---`);
            }},
        });
        await command.execute({});
        assert.equal(writes.length, 1);
        assert.equal(writes[0].path, '/tmpl/de/journal/hello.md');
        assert.match(writes[0].text, /title: Hallo/);
        assert.match(writes[0].text, /date: 2026-09-23/);
        assert.match(writes[0].text, /# Hallo `code`/);
        assert.deepEqual(checked, ['/tmpl/de/journal/hello.prompt.md']);
        badAnswer = true;
        data['journal/hello.md'].de = null;
        await command.execute({});
        assert.equal(writes[1].path, '/tmpl/de/journal/hello.answer.md');
        assert.equal(writes[1].text, 'invalid ---END FILE---');
        assert.equal(errors.length, 1);
    });
});
