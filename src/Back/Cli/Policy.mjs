// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Policy
 * @description Selects the CMS web handlers installed by its CLI plugin.
 */
export default class Policy {
    /** Creates the default site policy. */
    constructor() {
        /** @returns {string} */
        this.getMode = () => 'site';
    }
}
