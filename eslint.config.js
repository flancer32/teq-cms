import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import {defineConfig} from 'eslint/config';
import globals from 'globals';

export default defineConfig([
    {
        files: ['**/*.js', '**/*.mjs'],
        plugins: {
            js,
            jsdoc,
        },
        extends: ['js/recommended'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                myCustomGlobal: 'readonly',
            },
        },
        rules: {
            // Recommended ESLint rules
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'eqeqeq': 'error',
            'curly': ['error', 'multi-line'],
            'semi': ['error', 'always'],
            // Your JSDoc rules
            'jsdoc/check-alignment': 'error',
            'jsdoc/check-param-names': 'error',
            'jsdoc/check-types': 'error',
            'jsdoc/require-param-description': 'warn',
        },
    },
]);
