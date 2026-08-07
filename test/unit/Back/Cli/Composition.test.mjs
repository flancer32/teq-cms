import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Configurator from '../../../../bootstrap/configurator.mjs';

describe('TeqCMS CLI composition', () => {
    it('selects CMS implementations for host contracts', () => {
        const {preprocessors} = new Configurator().configure({applicationRoot: process.cwd(), argv: []});
        const preprocess = preprocessors[0];
        assert.equal(
            preprocess({platform: 'node', moduleName: 'Fl32_Tmpl_Back_Api_Engine'}).moduleName,
            'Fl32_Cms_Back_Di_Replace_Tmpl_Engine',
        );
        assert.equal(
            preprocess({platform: 'node', moduleName: 'Fl32_Cms_Back_Api_Adapter'}).moduleName,
            'Fl32_Cms_Back_Di_Replace_Adapter',
        );
    });
});
