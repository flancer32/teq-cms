// @ts-check

/**
 * @namespace Fl32_Cms_Back_Platform_Fetch
 * @description Native fetch adapter for backend integrations.
 */
export default class Fl32_Cms_Back_Platform_Fetch {
    /**
     * @param {object} deps
     */
    constructor({}) {
        /**
         * @param {Parameters<typeof fetch>[0]} input
         * @param {Parameters<typeof fetch>[1]} [init]
         * @returns {Promise<Response>}
         */
        this.fetch = async function (input, init) {
            return await fetch(input, init);
        };
    }
}
