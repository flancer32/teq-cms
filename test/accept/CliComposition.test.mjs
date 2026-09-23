import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Configurator from '../../bootstrap/di-config.mjs';

describe('TeqCMS CLI composition', () => {
    it('selects CMS implementations without owning configuration sources', () => {
        const configuration = new Configurator().configure({applicationRoot: process.cwd(), argv: []});
        assert.deepEqual(configuration.container.preprocessors,
            ['Fl32_Cms_Back_Di_Preprocessor$']);
        assert.equal(configuration.configuration, undefined);
    });
});
