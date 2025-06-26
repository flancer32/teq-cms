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
    const resolver = container.getResolver();
    resolver.addNamespaceRoot('Fl32_Cms_', SRC);
    resolver.addNamespaceRoot('Fl32_Tmpl_', join(NPM, '@flancer32', 'teq-tmpl', 'src'));
    resolver.addNamespaceRoot('Fl32_Web_', join(NPM, '@flancer32', 'teq-web', 'src'));
    container.enableTestMode();
    return container;
}