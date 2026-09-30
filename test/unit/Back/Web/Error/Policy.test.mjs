import {it} from 'node:test';
import assert from 'node:assert/strict';
import Policy from '../../../../../src/Back/Web/Error/Policy.mjs';

it('defines the public default error template convention', () => {
    const policy = new Policy();
    assert.equal(policy.getTemplateName({status: 404, locale: 'ru', path: '/docs/missing'}), '404.html');
    assert.equal(policy.getTemplateName({status: 500, locale: 'en', path: '/'}), undefined);
});
