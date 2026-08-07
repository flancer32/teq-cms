// @ts-check

/**
 * @namespace Fl32_Cms_Back_Api_Adapter
 * @description CMS application adapter contract.
 *
 * Application adapter interface for the CMS plugin.
 *
 * This adapter connects the plugin to the application-specific logic.
 * It allows the application to analyze the incoming HTTP request and
 * return the data and rendering options required to process the page
 * using the selected template engine.
 *
 * The plugin interacts with this interface only, without knowledge of the implementation.
 *
 * @interface
 */
export default class Fl32_Cms_Back_Api_Adapter {
    /**
     * Analyze the incoming request and provide data and rendering options for the template engine.
     *
     * This method is called on every HTTP request handled by the CMS plugin.
     * The application must extract context-specific information (e.g., locale, route data, user agent)
     * and prepare a structured result that will be passed to the template renderer.
     *
     * @param {object} deps - Parameters object.
     * @param {object} deps.req - The HTTP(S) request object.
     * @returns {Promise<object>} Rendering context for the template engine.
     * @throws {Error} If the method is not implemented by the application.
     */
    async getRenderData({req}) {
        throw new Error('Method not implemented');
    }
}

/**
 * @typedef {object} Fl32_Cms_Back_Api_Adapter.RenderData
 * @property {object} data - Variables used in the template (e.g., page metadata, content blocks, user info).
 * @property {object} options - Template engine options (e.g., layout, partials, flags).
 * @property {Fl32_Tmpl_Back_Dto_Target.Dto} target - Render target metadata including template path, type, and localization context.
 */
