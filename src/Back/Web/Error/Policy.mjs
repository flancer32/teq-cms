// @ts-check

/**
 * @namespace Fl32_Cms_Back_Web_Error_Policy
 * @description Host-replaceable error presentation convention.
 */
export default class Policy {
    /** Initializes the default presentation convention. */
    constructor() {
        /**
         * @param {object} deps
         * @param {number} deps.status
         * @param {string|undefined} deps.locale
         * @param {string} deps.path Safe pathname without query parameters.
         * @returns {string|undefined}
         */
        this.getTemplateName = ({status, locale, path}) => {
            void locale;
            void path;
            return status === 404 ? '404.html' : undefined;
        };
    }
}
