/**
 * Application adapter interface for the CMS plugin.
 *
 * This adapter connects the plugin to the application-specific logic.
 * It allows the application to analyze the incoming HTTP request and
 * return the data and rendering options required to process the page
 * using the selected template engine.
 *
 * The plugin interacts with this interface only, without knowledge of the implementation.
 *
 * @interface Fl32_Cms_Back_Api_Adapter
 */
export default class Fl32_Cms_Back_Api_Adapter {
    /* eslint-disable no-unused-vars */
    /**
     * Analyze the incoming request and provide data and rendering options for the template engine.
     *
     * This method is called on every HTTP request handled by the CMS plugin.
     * The application must extract context-specific information (e.g., locale, route data, user agent)
     * and prepare a structured result that will be passed to the template renderer.
     *
     * @param {object} args - Parameters object.
     * @param {import('node:http').IncomingMessage | import('node:http2').Http2ServerRequest} args.req - The HTTP(S) request object.
     * @returns {Promise<{data: object, options: object}>} - Data to be passed to the template engine.
     *   - `data`: object with variables used in the template.
     *   - `options`: rendering options (e.g., template name, layout name, localization settings).
     * @throws {Error} If the method is not implemented by the application.
     */
    async getRenderData({req}) {
        throw new Error('Method not implemented');
    }
}
