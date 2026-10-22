import {it} from 'node:test';
import assert from 'node:assert/strict';
import Representation from '../../../../src/Back/Publication/Representation.mjs';

it('gives explicit suffixes priority over Accept and client hints', () => {
    const representation = new Representation();
    assert.equal(representation.select({suffix: 'md', headers: {accept: 'text/html', 'user-agent': 'Mozilla/5.0'}}), 'md');
    assert.equal(representation.select({suffix: 'html', headers: {accept: 'text/markdown;q=1,text/html;q=0', 'user-agent': 'ExampleBot'}}), 'html');
});

it('uses explicit supported media preferences and excludes rejected representations', () => {
    const representation = new Representation();
    for (const [accept, expected] of [
        ['text/markdown', 'md'], ['text/html', 'html'], ['application/xhtml+xml', 'html'],
        ['text/html;q=0.5,text/markdown;q=0.9', 'md'],
        ['text/markdown;q=0.5,application/xhtml+xml;q=0.9', 'html'],
        ['TEXT/MARKDOWN; charset=utf-8; q=0.8,text/html;q=0.1', 'md'],
        ['text/markdown;q=0,text/html;q=0', null],
        ['text/markdown;q=0', 'html'], ['text/html;q=0', 'md'],
        ['text/markdown;q=invalid,text/html;q=0.5', 'html'],
        ['text/html;q=0,text/html;q=1,text/markdown;q=0.5', 'html'],
    ]) {
        assert.equal(representation.select({headers: {accept, 'user-agent': 'ExampleBot'}}), expected, accept);
    }
});

it('uses agent hints for ambiguous preferences and defaults unknown clients to HTML', () => {
    const representation = new Representation();
    for (const accept of [undefined, '*/*', 'application/json', 'text/markdown,text/html']) {
        for (const ua of ['ExampleBot/1.0', 'ChatGPT-User', 'ClaudeBot', 'GPTBot', 'curl/8.0', 'wget/1.0', 'python-requests/2.0']) {
            assert.equal(representation.select({headers: {accept, 'user-agent': ua}}), 'md');
        }
        for (const ua of [undefined, 'Mozilla/5.0', 'UnknownClient']) {
            assert.equal(representation.select({headers: {accept, 'user-agent': ua}}), 'html');
        }
    }
});

const socialCrawlers = ['TelegramBot (like TwitterBot)', 'Twitterbot/1.0',
    'facebookexternalhit/1.1', 'Facebot', 'LinkedInBot/1.0', 'Slackbot-LinkExpanding 1.0',
    'Discordbot/2.0', 'WhatsApp/2.0', 'Pinterestbot/1.0', 'SkypeUriPreview/1.0'];

it('serves HTML to known social preview crawlers only when format preferences are ambiguous', () => {
    const representation = new Representation();
    for (const ua of socialCrawlers) {
        for (const accept of [undefined, '*/*', 'application/json', 'text/markdown,text/html']) {
            assert.equal(representation.select({headers: {accept, 'user-agent': ua.toLowerCase()}}), 'html', `${ua} ${accept}`);
        }
        for (const [accept, expected] of [
            ['text/markdown', 'md'], ['text/html', 'html'],
            ['text/markdown;q=0.9,text/html;q=0.5', 'md'],
            ['text/markdown;q=0.5,text/html;q=0.9', 'html'],
            ['text/html;q=0', 'md'], ['text/markdown;q=0', 'html'],
            ['text/markdown;q=0,text/html;q=0', null],
        ]) assert.equal(representation.select({headers: {accept, 'user-agent': ua}}), expected, `${ua} ${accept}`);
        for (const suffix of ['md', 'html']) {
            assert.equal(representation.select({suffix, headers: {
                accept: 'text/markdown;q=0,text/html;q=0', 'user-agent': ua,
            }}), suffix, ua);
        }
    }
});
