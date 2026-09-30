// @ts-check

/**
 * @namespace Fl32_Cms_Back_Publication_Policy
 * @description Host-owned publication and static routing policy; replace through DI.
 */
export default class Policy {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Config} deps.config
     */
    constructor({config}) {
        /** @returns {'site'|'families'} */
        this.getMode = () => config.getPublicationFamilies().length ? 'families' : 'site';
        /** @returns {string[]} URL prefixes delivered exclusively from web/. */
        this.getStaticPrefixes = () => ['/assets/'];
        /**
         * @param {object} deps
         * @param {string} deps.route
         * @param {string} deps.locale Empty string denotes an unlocalized source.
         * @returns {string} Host presentation template name.
         */
        this.getPresentationName = ({route, locale}) => {
            void route;
            void locale;
            return 'publication.html';
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({config: 'Fl32_Cms_Back_Config$'}),
});
