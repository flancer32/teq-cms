// @ts-check

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @namespace Fl32_Cms_Bootstrap_Configurator
 * @description Pre-DI host configurator for TeqCMS development.
 *
 * This module is loaded by @teqfw/cli through dynamic import before the DI
 * container is resolved. It must remain a plain host-composition module and
 * is intentionally outside teqfw-esm-validator validation.
 * @implements {TeqFw_Cli_Api_Container_Configurator}
 */
export default class Configurator {
    /**
     * @param {TeqFw_Cli_Api_Container_Configurator_Params} params
     * @returns {TeqFw_Cli_Api_Container_Configurator_Configuration}
     */
    configure({applicationRoot, argv}) {
        void argv;
        return {
            preprocessors: [createReplacePreprocessor()],
            configuration: {
                sources: [
                    createObjectSource({
                        TEQFW_TMPL__ALLOWED_LOCALES: ['en', 'es', 'ru'],
                        TEQFW_TMPL__DEFAULT_LOCALE: 'en',
                        TEQFW_TMPL__ROOT_PATH: applicationRoot,
                        TEQ_CMS__AI_API_MODEL: 'gpt-4o-mini',
                        TEQ_CMS__LOCALE_BASE_TRANSLATE: 'ru',
                    }, 'teq-cms-defaults'),
                    createDotenvSource(path.join(applicationRoot, '.env')),
                    createProcessEnvSource(process.env),
                ],
            },
        };
    }
}

/** @param {Record<string, unknown>} values @param {string} id @returns {TeqFw_Cfg_Source__Captured} */
function createObjectSource(values, id) {
    return Object.freeze({
        id,
        load: async () => Object.freeze(Object.entries(values).map(([key, value]) => Object.freeze({key, value}))),
    });
}

/** @param {Record<string, unknown>} environment @returns {TeqFw_Cfg_Source__Captured} */
function createProcessEnvSource(environment) {
    return Object.freeze({
        id: 'process-env',
        load: async () => Object.freeze(Object.entries(environment)
            .filter(([key, value]) => key.includes('__') && typeof value === 'string')
            .map(([key, value]) => Object.freeze({key, value: normalizeValue(key, value)}))),
    });
}

/** @param {string} filePath @returns {TeqFw_Cfg_Source__Captured} */
function createDotenvSource(filePath) {
    return Object.freeze({
        id: 'project-dotenv',
        load: async () => {
            try {
                const text = await fs.readFile(filePath, 'utf8');
                return Object.freeze(parseDotenv(text).map(([key, value]) => Object.freeze({
                    key,
                    value: normalizeValue(key, value),
                })));
            } catch (error) {
                if (error?.code === 'ENOENT') return Object.freeze([]);
                throw error;
            }
        },
    });
}

/** @param {string} text @returns {Array<[string, string]>} */
function parseDotenv(text) {
    const result = [];
    for (const line of text.split(/\r?\n/u)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u);
        if (!match) continue;
        let value = match[2];
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        result.push([match[1], value]);
    }
    return result;
}

/** @param {string} key @param {string} value @returns {string|string[]} */
function normalizeValue(key, value) {
    return key === 'TEQFW_TMPL__ALLOWED_LOCALES'
        ? value.split(',').map(item => item.trim()).filter(Boolean)
        : value;
}

/** @returns {TeqFw_Cli_Api_Container_Preprocessor} */
function createReplacePreprocessor() {
    const replacements = new Map([
        ['Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Replace_Adapter'],
        ['Fl32_Tmpl_Back_Api_Engine', 'Fl32_Cms_Back_Di_Replace_Tmpl_Engine'],
    ]);
    return depId => {
        const replacement = replacements.get(depId.moduleName);
        return replacement ? Object.freeze({...depId, moduleName: replacement}) : depId;
    };
}
