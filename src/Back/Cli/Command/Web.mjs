// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Command_Web
 * @description CLI command for starting the web server.
 *
 * Launch the demo web server using configured environment settings.
 */
export default class Fl32_Cms_Back_Cli_Command_Web {
    /**
     * @param {object} deps
     * @param {typeof import('node:path')} deps.path
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Web_Back_Config_Runtime__Factory} deps.configFactory
     * @param {Fl32_Web_Back_PipelineEngine} deps.dispatcher
     * @param {Fl32_Web_Back_Handler_Pre_Log} deps.handLog
     * @param {Fl32_Web_Back_Handler_Static} deps.handStatic
     * @param {Fl32_Cms_Back_Web_Handler_Template} deps.handTmpl
     * @param {Fl32_Web_Back_Dto_Source__Factory} deps.dtoSource
     * @param {Fl32_Web_Back_Server} deps.server
     */
    constructor(
        {
            path,
            tmplConfig,
            configFactory,
            dispatcher,
            handLog,
            handStatic,
            handTmpl,
            dtoSource,
            server,
        }
    ) {
        /**
         * Initializes the command descriptor.
         */
        this.id = 'web:start';
        this.summary = 'Start the TeqCMS web server.';
        this.lifetime = 'long-running';

        /**
         * @param {object} deps
         * @param {AbortSignal} deps.signal
         * @returns {Promise<object>}
         */
        this.start = async function ({signal}) {
            const rootCms = tmplConfig.getRootPath();
            const rootWeb = path.join(rootCms, 'web');

            const dto = dtoSource.create({
                root: rootWeb,
                prefix: '/',
                allow: {'.': ['.']},
                defaults: ['index.html'],
            });

            await handStatic.init({sources: [dto]});

            dispatcher.addHandler(handLog);
            dispatcher.addHandler(handStatic);
            dispatcher.addHandler(handTmpl);

            configFactory.freeze();
            await server.start();
            const done = new Promise((resolve) => signal.addEventListener('abort', resolve, {once: true}));
            return {
                done,
                stop: async () => server.stop(),
            };
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        path: 'node:path',
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        configFactory: 'Fl32_Web_Back_Config_Runtime__Factory$',
        dispatcher: 'Fl32_Web_Back_PipelineEngine$',
        handLog: 'Fl32_Web_Back_Handler_Pre_Log$',
        handStatic: 'Fl32_Web_Back_Handler_Static$',
        handTmpl: 'Fl32_Cms_Back_Web_Handler_Template$',
        dtoSource: 'Fl32_Web_Back_Dto_Source__Factory$',
        server: 'Fl32_Web_Back_Server$',
    }),
});
