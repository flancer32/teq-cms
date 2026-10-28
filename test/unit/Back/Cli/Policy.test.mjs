import {test} from 'node:test';
import assert from 'node:assert/strict';
import Policy from '../../../../src/Back/Cli/Policy.mjs';

test('CMS installs its full site pipeline by default', () => {
    assert.equal(new Policy().getMode(), 'site');
});
