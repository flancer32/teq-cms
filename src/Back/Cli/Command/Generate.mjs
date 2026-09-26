// @ts-check

/**
 * @namespace Fl32_Cms_Back_Cli_Command_Generate
 * @description Generates public robots, agent discovery, and sitemap files.
 */
export default class Generate {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Discovery_Generator} deps.generator
     */
    constructor({generator}) {
        this.id = 'cms:generate';
        this.summary = 'Generate robots.txt, llms.txt, and sitemap.xml from public Markdown.';
        this.lifetime = 'finite';
        /** @returns {Promise<void>} */
        this.execute = async () => {
            await generator.write();
        };
    }
}

export const __deps__ = Object.freeze({
    default: Object.freeze({generator: 'Fl32_Cms_Back_Discovery_Generator$'}),
});
