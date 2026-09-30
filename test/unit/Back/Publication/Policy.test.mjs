import {it} from 'node:test';
import assert from 'node:assert/strict';
import Policy from '../../../../src/Back/Publication/Policy.mjs';

it('selects site-wide publication by default and preserves explicit legacy families', () => {
    for (const families of [[], [{prefix: 'docs', presentation: 'page.html'}]]) {
        const policy = new Policy({config: {getPublicationFamilies: () => families}});
        assert.equal(policy.getMode(), families.length ? 'families' : 'site');
        assert.deepEqual(policy.getStaticPrefixes(), ['/assets/']);
        assert.equal(policy.getPresentationName({route: 'about', locale: 'en'}), 'publication.html');
    }
});
