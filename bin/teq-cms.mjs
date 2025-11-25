#!/usr/bin/env node
'use strict';

import dotenv from 'dotenv';
import { dirname, join, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = findProjectRoot();
if (!projectRoot) {
    console.error('Could not find the `./node_modules/` folder in the project root. Please install the application dependencies.');
    process.exitCode = 1;
} else {
    await bootstrap(projectRoot);
}

async function bootstrap(rootDir) {
    dotenv.config({ path: join(rootDir, '.env') });
    const nodeModulesDir = join(rootDir, 'node_modules');
    const cmsRoot = process.env.TEQ_CMS_ROOT ? resolve(rootDir, process.env.TEQ_CMS_ROOT) : rootDir;

    const { default: Container } = await import('@teqfw/di');
    const container = new Container();
    const resolver = container.getResolver();

    for (const [namespace, namespaceRoot] of resolveNamespaceRoots(rootDir, nodeModulesDir)) {
        resolver.addNamespaceRoot(namespace, namespaceRoot);
    }

    /** @type {TeqFw_Di_Pre_Replace} */
    const replace = await container.get('TeqFw_Di_Pre_Replace$');
    configureReplacePreProcessor(replace);
    container.getPreProcessor().addChunk(replace);

    await loadUserConfiguration(rootDir, { resolver, replace });

    /** @type {Fl32_Cms_Back_Cli_Command} */
    const command = await container.get('Fl32_Cms_Back_Cli_Command$');
    await command.run(cmsRoot, process.argv);
}

function configureReplacePreProcessor(replace) {
    replace.add('Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Replace_Adapter');
    replace.add('Fl32_Tmpl_Back_Api_Engine', selectTemplateEngine(process.env.TEQ_CMS_TMPL_ENGINE));
}

function selectTemplateEngine(engine) {
    if (engine === 'nunjucks') {
        return 'Fl32_Tmpl_Back_Service_Engine_Nunjucks';
    }
    if (engine === 'mustache') {
        return 'Fl32_Tmpl_Back_Service_Engine_Mustache';
    }
    return 'Fl32_Tmpl_Back_Service_Engine_Simple';
}

async function loadUserConfiguration(rootDir, context) {
    const configurator = findConfigurator(rootDir);
    if (!configurator) {
        return;
    }
    await executeConfigurator(configurator, context);
}

function resolveNamespaceRoots(rootDir, nodeModulesDir) {
    const installedCmsRoot = resolve(nodeModulesDir, '@flancer32', 'teq-cms', 'src');
    const localCmsRoot = resolve(rootDir, 'src');
    const cmsRoot = existsSync(installedCmsRoot) ? installedCmsRoot : localCmsRoot;

    return [
        ['Fl32_Cms_', cmsRoot],
        ['Fl32_Tmpl_', resolve(nodeModulesDir, '@flancer32', 'teq-tmpl', 'src')],
        ['Fl32_Web_', resolve(nodeModulesDir, '@flancer32', 'teq-web', 'src')],
        ['TeqFw_Di_', resolve(nodeModulesDir, '@teqfw', 'di', 'src')],
    ];
}

function findConfigurator(rootDir) {
    const directConfig = findDirectConfigurator(rootDir);
    if (directConfig) {
        return directConfig;
    }

    const packagePath = resolve(rootDir, 'package.json');
    if (!existsSync(packagePath)) {
        return;
    }

    const pkg = parsePackageJson(packagePath);
    if (!pkg || typeof pkg.teqcms?.configure !== 'string') {
        return;
    }

    const configuredFile = resolve(rootDir, pkg.teqcms.configure);
    if (existsSync(configuredFile)) {
        return configuredFile;
    }

    console.warn('TeqCMS configuration file not found:', configuredFile);
}

function findDirectConfigurator(rootDir) {
    for (const candidate of ['teqcms.config.mjs', 'teqcms.config.js']) {
        const file = resolve(rootDir, candidate);
        if (existsSync(file)) {
            return file;
        }
    }
}

function parsePackageJson(file) {
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
        console.warn('Failed to parse package.json for TeqCMS configuration', error);
    }
}

async function executeConfigurator(file, context) {
    try {
        const module = await import(pathToFileURL(file).href);
        if (typeof module?.default !== 'function') {
            console.warn('TeqCMS configuration must export a default async function.');
            return;
        }
        await module.default(context);
    } catch (error) {
        console.error('Failed to load TeqCMS configuration from ' + file, error);
    }
}

function findProjectRoot() {
    let dir = resolve(dirname(fileURLToPath(import.meta.url)));
    while (true) {
        if (existsSync(join(dir, 'node_modules'))) {
            return dir;
        }
        const parent = dirname(dir);
        if (parent === dir) {
            return;
        }
        dir = parent;
    }
}
