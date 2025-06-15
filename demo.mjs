#!/usr/bin/env node
'use strict';
/**
 * Entry point for the Demo CMS application.
 * Configures the DI container and launches the web server.
 */
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import 'dotenv/config';

import Container from '@teqfw/di';
import Replace from '@teqfw/di/src/Pre/Replace.js';

// Paths
const root = dirname(fileURLToPath(import.meta.url));
const node = join(root, 'node_modules');
const rootCms = process.env.TEQ_CMS_TMPL_ROOT || root;
const rootWeb = process.env.TEQ_CMS_WEB_ROOT || join(root, 'web');

// Create and configure the DI container
const container = new Container();

/** Namespace resolver for locating modules. */
const resolver = container.getResolver();
resolver.addNamespaceRoot('Fl32_Cms_', join(root, 'src'));
resolver.addNamespaceRoot('Fl32_Tmpl_', join(node, '@flancer32', 'teq-tmpl', 'src'));
resolver.addNamespaceRoot('Fl32_Web_', join(node, '@flancer32', 'teq-web', 'src'));

// Add interface replacements
/** Replaces CMS adapter interface with app-specific implementation. */
const replace = new Replace();
replace.add('Fl32_Cms_Back_Api_Adapter', 'Fl32_Cms_Back_Di_Adapter');
replace.add('Fl32_Tmpl_Back_Api_Adapter', 'Fl32_Tmpl_Back_Di_Adapter');
container.getPreProcessor().addChunk(replace);

// Configure the CMS
/** @type {Fl32_Cms_Back_Config} */
const config = await container.get('Fl32_Cms_Back_Config$');
config.init(
    {
        aiApiBaseUrl: process.env.TEQ_CMS_AI_API_BASE_URL,
        aiApiKey: process.env.TEQ_CMS_AI_API_KEY,
        aiApiModel: process.env.TEQ_CMS_AI_API_MODEL,
        aiApiOrg: process.env.TEQ_CMS_AI_API_ORG,
        localeAllowed: process.env.TEQ_CMS_LOCALE_ALLOWED?.split(',') || ['en', 'es', 'ru'],
        localeBaseTranslate: process.env.TEQ_CMS_LOCALE_BASE_TRANSLATE || 'ru',
        localeBaseWeb: process.env.TEQ_CMS_LOCALE_BASE_DISPLAY || 'en',
        rootPath: rootCms,
        tmplEngine: process.env.TEQ_CMS_TMPL_ENGINE,
    }
);

// Configure the web requests dispatcher
/** @type {Fl32_Web_Back_Dispatcher} */
const dispatcher = await container.get('Fl32_Web_Back_Dispatcher$');
/** @type {Fl32_Web_Back_Handler_Pre_Log} */
const handLog = await container.get('Fl32_Web_Back_Handler_Pre_Log$');
/** @type {Fl32_Web_Back_Handler_Static} */
const handStatic = await container.get('Fl32_Web_Back_Handler_Static$');
/** @type {Fl32_Cms_Back_Web_Handler_Template} */
const handTmpl = await container.get('Fl32_Cms_Back_Web_Handler_Template$');

await handStatic.init({rootPath: rootWeb});

dispatcher.addHandler(handLog);
dispatcher.addHandler(handStatic);
dispatcher.addHandler(handTmpl);

// Launch the internal HTTP server
/** @type {Fl32_Web_Back_Server_Config} */
const dtoConfigWeb = await container.get('Fl32_Web_Back_Server_Config$');
const cfg = dtoConfigWeb.create({
    port: process.env.PORT,
    type: 'http', // HTTP1
});
/** @type {Fl32_Web_Back_Server} */
const server = await container.get('Fl32_Web_Back_Server$');
await server.start(cfg);