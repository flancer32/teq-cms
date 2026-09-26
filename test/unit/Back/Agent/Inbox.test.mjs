import {it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import Inbox from '../../../../src/Back/Agent/Inbox.mjs';

it('stores an accepted message privately under the application root', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-inbox-'));
    const inbox = new Inbox({tmplConfig: {getRootPath: () => root}, fs, path, crypto});
    try {
        await inbox.accept({agent: 'agent-1', message: 'Hello owner'});
        const directory = path.join(root, 'var', 'teq-cms', 'agent-messages');
        const files = await fs.readdir(directory);
        assert.equal(files.length, 1);
        const record = JSON.parse(await fs.readFile(path.join(directory, files[0]), 'utf8'));
        assert.equal(record.agent, 'agent-1');
        assert.equal(record.message, 'Hello owner');
        assert.match(record.receivedAt, /^\d{4}-\d{2}-\d{2}T/);
        assert.equal((await fs.stat(path.join(directory, files[0]))).mode & 0o777, 0o600);
        const elsewhere = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-inbox-outside-'));
        try {
            await fs.rm(path.join(root, 'var'), {recursive: true});
            await fs.symlink(elsewhere, path.join(root, 'var'));
            await assert.rejects(inbox.accept({agent: 'agent-1', message: 'Do not escape'}), /real directory/);
            assert.deepEqual(await fs.readdir(elsewhere), []);
        } finally {
            await fs.rm(elsewhere, {recursive: true, force: true});
        }
    } finally {
        await fs.rm(root, {recursive: true, force: true});
    }
});
