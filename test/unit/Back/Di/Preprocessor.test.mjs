import {it} from 'node:test';
import assert from 'node:assert/strict';
import Preprocessor from '../../../../src/Back/Di/Preprocessor.mjs';

it('maps standalone host contracts while preserving dependency identity', () => {
    const preprocess = Preprocessor();
    const original = {addressKind: 'TEQ', address: 'Fl32_Cms_Back_Api_Adapter', exportName: null, lifestyle: 'SINGLETON', wrappers: []};
    assert.deepEqual(preprocess(original), {...original, address: 'Fl32_Cms_Back_Di_Replace_Adapter'});
    assert.equal(original.address, 'Fl32_Cms_Back_Api_Adapter');
    assert.equal(preprocess({...original, address: 'Other_Service'}).address, 'Other_Service');
});
