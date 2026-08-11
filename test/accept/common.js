/**
 * Provides a utility to create a configured TeqFW DI container for unit testing.
 */
import {join, resolve} from 'node:path';
import Container from '@teqfw/di';

// Resolve the plugin source path relative to this script
const SRC = resolve(import.meta.dirname, '../../src');
const NPM = resolve(import.meta.dirname, '../../node_modules');

/**
 * Builds a test DI container for unit tests.
 * Registers plugin namespace and enables test mode.
 *
 * @returns {TeqFw_Di_Container} Test container instance.
 */
export function buildTestContainer() {
    const container = new Container();
    container.addNamespaceRoot('Fl32_Cms_', SRC, '.mjs');
    container.addNamespaceRoot('Fl32_Tmpl_', join(NPM, '@flancer32', 'teq-tmpl', 'src'), '.js');
    container.addNamespaceRoot('TeqFw_Web_', join(NPM, '@teqfw', 'web', 'src'), '.mjs');
    container.addNamespaceRoot('TeqFw_Cfg_', join(NPM, '@teqfw', 'cfg', 'src'), '.mjs');
    container.addNamespaceRoot('TeqFw_Cli_', join(NPM, '@teqfw', 'cli', 'src'), '.mjs');
    container.addNamespaceRoot('TeqFw_Log_', join(NPM, '@teqfw', 'log', 'src'), '.mjs');
    container.enableTestMode();
    const replacements = new Map([
        ['Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Replace_Adapter'],
        ['Fl32_Tmpl_Back_Api_Engine', 'Fl32_Tmpl_Back_Service_Engine_Simple'],
    ]);
    container.addPreprocess((depId) => {
        const replacement = replacements.get(depId.moduleName);
        return replacement ? Object.freeze({...depId, moduleName: replacement}) : depId;
    });
    container.register('TeqFw_Cfg_Reader$', {
        get: (namespace) => namespace === 'TEQFW_TMPL'
            ? {
                ALLOWED_LOCALES: ['en'],
                DEFAULT_LOCALE: 'en',
                ENGINE: 'simple',
            }
            : namespace === 'TEQFW_WEB'
                ? {
                PORT: 3050,
                TYPE: 'http',
                }
                : {
                    LOCALE_BASE_TRANSLATE: 'en',
                },
    });
    container.register('TeqFw_Cli_Config$', {
        applicationRoot: process.cwd(),
        cwd: process.cwd(),
        argv: [],
        dotenvPath: undefined,
        dotenvExplicit: false,
    });
    return container;
}
