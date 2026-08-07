import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Configurator from '../../../../bootstrap/di-config.mjs';

describe('TeqCMS CLI composition', () => {
    it('selects CMS implementations without owning configuration sources', () => {
        const configuration = new Configurator().configure({applicationRoot: process.cwd(), argv: []});
        const {preprocessors} = configuration;
        const preprocess = preprocessors[0];
        assert.equal(
            preprocess({platform: 'node', moduleName: 'Fl32_Tmpl_Back_Api_Engine'}).moduleName,
            'Fl32_Cms_Back_Di_Replace_Tmpl_Engine',
        );
        assert.equal(
            preprocess({platform: 'node', moduleName: 'Fl32_Cms_Back_Api_Adapter'}).moduleName,
            'Fl32_Cms_Back_Di_Replace_Adapter',
        );
        assert.equal(configuration.configuration, undefined);
    });
});
