/**
 * Launch the demo web server using configured environment settings.
 */
export default class Fl32_Cms_Back_Cli_Command_Web {
    /* eslint-disable jsdoc/require-param-description,jsdoc/check-param-names */
    /**
     * @param {typeof import('node:path')} path
     * @param {Fl32_Cms_Back_Config} config
     * @param {Fl32_Web_Back_Dispatcher} dispatcher
     * @param {Fl32_Web_Back_Handler_Pre_Log} handLog
     * @param {Fl32_Web_Back_Handler_Static} handStatic
     * @param {Fl32_Cms_Back_Web_Handler_Template} handTmpl
     * @param {Fl32_Web_Back_Dto_Handler_Source} dtoSource
     * @param {Fl32_Web_Back_Server} server
     */
    constructor(
        {
            'node:path': path,
            Fl32_Cms_Back_Config$: config,
            Fl32_Web_Back_Dispatcher$: dispatcher,
            Fl32_Web_Back_Handler_Pre_Log$: handLog,
            Fl32_Web_Back_Handler_Static$: handStatic,
            Fl32_Cms_Back_Web_Handler_Template$: handTmpl,
            Fl32_Web_Back_Dto_Handler_Source$: dtoSource,
            Fl32_Web_Back_Server$: server,
        }
    ) {
        /* eslint-enable jsdoc/require-param-description,jsdoc/check-param-names */
        this.exec = async function () {
            const rootCms = config.getRootPath();
            const rootWeb = path.join(rootCms, 'web');

            const dto = dtoSource.create();
            dto.root = rootWeb;
            dto.prefix = '/';
            dto.allow = {'.': ['.']};
            dto.defaults = ['index.html'];

            await handStatic.init({sources: [dto]});

            dispatcher.addHandler(handLog);
            dispatcher.addHandler(handStatic);
            dispatcher.addHandler(handTmpl);

            const cfg = config.getWebServerConfigDto();
            await server.start(cfg);
        };
    }
}
