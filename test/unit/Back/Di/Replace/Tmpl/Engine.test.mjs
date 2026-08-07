import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Engine from '../../../../../../src/Back/Di/Replace/Tmpl/Engine.mjs';

describe('Fl32_Cms_Back_Di_Replace_Tmpl_Engine', () => {
    for (const name of ['simple', 'mustache', 'nunjucks']) {
        it(`delegates to the ${name} engine`, async () => {
            const selected = {render: async params => ({engine: name, params})};
            const actual = new Engine({
                config: {getEngine: () => name},
                simple: name === 'simple' ? selected : {render: async () => ({})},
                mustache: name === 'mustache' ? selected : {render: async () => ({})},
                nunjucks: name === 'nunjucks' ? selected : {render: async () => ({})},
            });
            assert.deepEqual(await actual.render({value: 1}), {engine: name, params: {value: 1}});
        });
    }

    it('falls back to simple for an unknown engine', async () => {
        const wrapper = new Engine({
            config: {getEngine: () => 'unknown'},
            simple: {render: async () => 'simple'},
            mustache: {render: async () => 'mustache'},
            nunjucks: {render: async () => 'nunjucks'},
        });

        assert.equal(await wrapper.render({}), 'simple');
    });
});
