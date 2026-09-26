// @ts-check

/**
 * @namespace Fl32_Cms_Back_Agent_Inbox
 * @description Stores accepted agent-to-owner messages in the host's private var directory.
 */
export default class Inbox {
    /**
     * @param {object} deps
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {typeof import('node:fs/promises')} deps.fs
     * @param {typeof import('node:path')} deps.path
     * @param {typeof import('node:crypto')} deps.crypto
     */
    constructor({tmplConfig, fs, path, crypto}) {
        /**
         * @param {object} deps
         * @param {string} deps.agent
         * @param {string} deps.message
         * @returns {Promise<void>}
         */
        this.accept = async ({agent, message}) => {
            const root = await fs.realpath(tmplConfig.getRootPath());
            let directory = root;
            for (const segment of ['var', 'teq-cms', 'agent-messages']) {
                directory = path.join(directory, segment);
                try {
                    await fs.mkdir(directory, {mode: 0o700});
                } catch (error) {
                    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')) throw error;
                }
                if (!(await fs.lstat(directory)).isDirectory() || await fs.realpath(directory) !== directory) {
                    throw new Error('Agent inbox must be a real directory inside the application root.');
                }
            }
            const name = `${Date.now()}-${crypto.randomUUID()}.json`;
            const body = `${JSON.stringify({agent, message, receivedAt: new Date().toISOString()})}\n`;
            await fs.writeFile(path.join(directory, name), body, {encoding: 'utf8', flag: 'wx', mode: 0o600});
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({
        tmplConfig: 'Fl32_Tmpl_Back_Config$',
        fs: 'node:fs/promises',
        path: 'node:path',
        crypto: 'node:crypto',
    }),
});
