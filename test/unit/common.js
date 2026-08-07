/**
 * Provides a utility to create a configured TeqFW DI container for unit testing.
 */
import path from 'node:path';
import Container from '@teqfw/di';

// Resolve the plugin source path relative to this script
const SRC = path.resolve(import.meta.dirname, '../../src');

/**
 * Builds a test DI container for unit tests.
 * Registers plugin namespace and enables test mode.
 *
 * @returns {TeqFw_Di_Container} Test container instance.
 */
export function buildTestContainer() {
    const container = new Container();
    container.addNamespaceRoot('Fl32_Cms_', SRC, '.mjs');
    container.addNamespaceRoot('TeqFw_Cfg_', path.resolve(import.meta.dirname, '../../node_modules/@teqfw/cfg/src'), '.mjs');
    container.addNamespaceRoot('TeqFw_Log_', path.resolve(import.meta.dirname, '../../node_modules/@teqfw/log/src'), '.mjs');
    container.enableTestMode();
    return container;
}
