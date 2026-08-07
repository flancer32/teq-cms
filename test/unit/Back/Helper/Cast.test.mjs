import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Cast from '../../../../src/Back/Helper/Cast.mjs';

describe('Fl32_Cms_Back_Helper_Cast', () => {
    const cast = new Cast();

    it('casts scalar and array values', () => {
        assert.deepEqual(cast.array('a'), ['a']);
        assert.deepEqual(cast.array(['1', 'x'], value => value === '1' ? 1 : undefined), [1]);
        assert.deepEqual(cast.array(null), []);
    });

    it('casts supported boolean values and rejects unknown values', () => {
        assert.equal(cast.bool('yes'), true);
        assert.equal(cast.bool(0), false);
        assert.equal(cast.bool('maybe'), undefined);
    });

    it('casts numeric values', () => {
        assert.equal(cast.decimal('1.25'), 1.25);
        assert.equal(cast.int(' 42 items'), 42);
        assert.equal(cast.decimal('nope'), undefined);
    });

    it('normalizes and validates enum values', () => {
        const values = {ONE: 'one', TWO: 'two'};
        assert.equal(cast.enum('ONE', values, {lower: true}), 'one');
        assert.equal(cast.enum('two', values), 'two');
        assert.equal(cast.enum('three', values), undefined);
    });

    it('casts primitive values to strings', () => {
        assert.equal(cast.string(7), '7');
        assert.equal(cast.string(false), 'false');
        assert.equal(cast.string({}), undefined);
    });
});
