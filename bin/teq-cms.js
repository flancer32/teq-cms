#!/usr/bin/env node
'use strict';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import Container from '@teqfw/di';

// VARS
/* Resolve a path to the root folder. */
const url = new URL(import.meta.url);
const script = fileURLToPath(url);
const root = dirname(script);
const node = join(root, 'node_modules');

// MAIN
// Create a new instance of the container
const container = new Container();
debugger