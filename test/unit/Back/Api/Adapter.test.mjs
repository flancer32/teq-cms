import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import Adapter from '../../../../src/Back/Api/Adapter.mjs';

describe('Fl32_Cms_Back_Api_Adapter', () => {
    it('rejects calls to the abstract render-data contract', async () => {
        await assert.rejects(
            () => new Adapter().getRenderData({req: {}}),
            {message: 'Method not implemented'},
        );
    });
});
