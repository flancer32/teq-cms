import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Defaults from '../../../src/Back/Defaults.mjs';

describe('Fl32_Cms_Back_Defaults', () => {
    it('contains the translation response markers in the system prompt', () => {
        const defaults = new Defaults();

        assert.match(defaults.PROMPT_SYSTEM, /---FILE:/);
        assert.match(defaults.PROMPT_SYSTEM, /---END FILE---/);
        assert.match(defaults.PROMPT_SYSTEM, /template syntax/);
    });
});
