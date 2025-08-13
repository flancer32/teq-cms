#!/usr/bin/env node
'use strict';
import dotenv from 'dotenv';
import {dirname, join} from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import Container from '@teqfw/di';
import Replace from '@teqfw/di/src/Pre/Replace.js';

// VARS
/* Resolve a path to the root folder. */
const root = findProjectRoot();
dotenv.config({path: join(root, '.env')});
const rootCms = process.env.TEQ_CMS_ROOT || root;

// FUNCS
/**
 * Find the nearest folder containing node_modules.
 * @returns {string|undefined}
 */
function findProjectRoot() {
    let dir = dirname(fileURLToPath(import.meta.url));
    while (dir !== dirname(dir)) {
        if (existsSync(join(dir, 'node_modules'))) return dir;
        dir = dirname(join(dir, '..'));
    }
}

// MAIN
if (root) {
    const node = join(root, 'node_modules');
    // Create a new instance of the container
    const container = new Container();
    // Get the resolver from the container
    const resolver = container.getResolver();
    // set up the namespaces for the deps
    const nodeCms = join(node, '@flancer32', 'teq-cms');
    const pathCms = existsSync(join(nodeCms, 'src')) ? join(nodeCms, 'src') : join(root, 'src');
    resolver.addNamespaceRoot('Fl32_Cms_', pathCms);
    resolver.addNamespaceRoot('Fl32_Tmpl_', join(node, '@flancer32', 'teq-tmpl', 'src'));
    resolver.addNamespaceRoot('Fl32_Web_', join(node, '@flancer32', 'teq-web', 'src'));

    const replace = new Replace();
    replace.add('Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Replace_Adapter');
    const engine = process.env.TEQ_CMS_TMPL_ENGINE;
    if (engine === 'nunjucks') {
        replace.add('Fl32_Tmpl_Back_Api_Engine', 'Fl32_Tmpl_Back_Service_Engine_Nunjucks');
    } else if (engine === 'mustache') {
        replace.add('Fl32_Tmpl_Back_Api_Engine', 'Fl32_Tmpl_Back_Service_Engine_Mustache');
    } else {
        replace.add('Fl32_Tmpl_Back_Api_Engine', 'Fl32_Tmpl_Back_Service_Engine_Simple');
    }
    container.getPreProcessor().addChunk(replace);
    /** @type {Fl32_Cms_Back_Cli_Command} */
    const command = await container.get('Fl32_Cms_Back_Cli_Command$');
    await command.run(rootCms, process.argv);
} else {
    console.error('Could not find the `./node_modules/` folder in the project root. Please install the application dependencies.');
}
