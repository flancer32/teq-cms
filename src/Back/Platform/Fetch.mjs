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
         * @returns {Promise<unknown>}
         */
        this.fetch = async function (...args) {
            return await fetch(...args);
        };
    }
}
