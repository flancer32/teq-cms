// @ts-check

/**
 * @namespace Fl32_Cms_Back_Web_Error_Respond
 * @description Sends safe localized CMS errors through the platform transport helper.
 * @see https://github.com/flancer32/teq-cms/blob/main/ctx/docs/architecture/errors.md
 */
export default class Respond {
    /**
     * @param {object} deps
     * @param {Fl32_Cms_Back_Web_Error_Policy} deps.policy
     * @param {Fl32_Cms_Back_Publication_Routing} deps.routing
     * @param {Fl32_Cms_Back_Publication_Representation} deps.representation
     * @param {Fl32_Tmpl_Back_Config} deps.tmplConfig
     * @param {Fl32_Tmpl_Back_Service_Render} deps.render
     * @param {TeqFw_Web_Back_Helper_Respond} deps.respond
     * @param {TeqFw_Log_Provider} deps.logger
     */
    constructor({policy, routing, representation, tmplConfig, render, respond, logger}) {
        const log = logger.forSource('Fl32_Cms_Back_Web_Error_Respond');
        /**
         * Status is explicit so the presentation contract can grow independently of routing.
         * Only 404 is supported. Never retry rendering after a failure.
         * @param {object} deps
         * @param {TeqFw_Web_Back_Pipeline_RequestContext} deps.context
         * @param {number} [deps.status]
         * @param {'static'|'page'} [deps.kind]
         * @param {Record<string, string>} [deps.headers]
         * @returns {Promise<void>}
         */
        this.send = async ({context, status = 404, kind = 'page', headers = {}}) => {
            const {request: req, response: res} = context;
            /** @returns {boolean} */
            const writable = () => !context.completed && !res.destroyed && !res.closed && respond.isWritable(res);
            if (!writable()) return;
            if (status !== 404) throw new Error('Unsupported CMS error status.');
            const rawPath = (req.url ?? '').split('?')[0];
            // No raw request values enter templates. Policy sees a safe path only.
            const safePath = /^\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]*$/.test(rawPath) &&
                !rawPath.split('/').includes('.') && !rawPath.split('/').includes('..') ? rawPath : '/';
            const locales = tmplConfig.getAvailableLocales();
            const first = rawPath.split('/')[1];
            const locale = locales.includes(first) ? first : tmplConfig.getDefaultLocale();
            const endpoint = routing.isEndpoint(rawPath) || /^\/api(?:\/|$)/.test(rawPath);
            const staticResource = kind === 'static' || routing.isStatic(rawPath);
            const suffix = /\.(md|html)$/.exec(rawPath)?.[1];
            const fileResource = /\.[A-Za-z0-9]+$/.test(rawPath) && !suffix;
            const selected = representation.select({suffix, headers: req.headers ?? {}});
            const pageMethod = ['GET', 'HEAD'].includes(req.method ?? 'GET');
            const html = safePath === rawPath && !endpoint && !staticResource && !fileResource && selected === 'html' &&
                pageMethod;
            let contentType = endpoint ? 'application/json; charset=utf-8' :
                safePath === rawPath && pageMethod && !staticResource && !fileResource && selected === 'md' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8';
            let body = endpoint ? '{"error":"Not Found","status":404}' : contentType.startsWith('text/markdown') ? '# 404 Not Found\n' : 'Not Found';
            if (html) {
                try {
                    const name = policy.getTemplateName({status, locale, path: safePath});
                    if (name !== undefined) {
                        if (!/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.html$/.test(name)) {
                            throw new Error('Invalid error template name.');
                        }
                        const result = await render.perform({
                            target: {type: 'web', name, locales: {user: locale, app: tmplConfig.getDefaultLocale()}},
                            data: {error: {status, title: 'Not Found'}, statusCode: status, locale, allowedLocales: [...locales]},
                            options: {},
                        });
                        if (result.resultCode === 'SUCCESS' && typeof result.content === 'string' && result.content.trim()) {
                            body = result.content;
                            contentType = 'text/html; charset=utf-8';
                        } else if (result.resultCode !== 'PATH_NOT_FOUND' && result.resultCode !== 'TMPL_IS_EMPTY') {
                            log.error('Error presentation failed.', {status, resultCode: result.resultCode});
                        }
                    }
                } catch {
                    // Log no request, configuration, template path, or engine exception details.
                    log.error('Error presentation failed.', {status});
                }
            }
            if (!writable()) return;
            const vary = new Set((headers.vary ?? '').split(',').map(value => value.trim()).filter(Boolean));
            if (!suffix && !endpoint && !staticResource && !fileResource) {
                vary.add('Accept');
                vary.add('User-Agent');
            }
            /** @type {Record<string, string>} */
            const responseHeaders = {...headers, 'content-type': contentType, 'cache-control': 'no-store',
                'x-robots-tag': 'noindex, follow', 'content-length': String(Buffer.byteLength(body))};
            if (vary.size) responseHeaders.vary = [...vary].join(', ');
            if (respond.code404_NotFound({res, headers: responseHeaders, body: req.method === 'HEAD' ? '' : body})) {
                context.completed = true;
            }
        };
    }
}

export const __deps__ = Object.freeze({default: Object.freeze({
    policy: 'Fl32_Cms_Back_Web_Error_Policy$',
    routing: 'Fl32_Cms_Back_Publication_Routing$',
    representation: 'Fl32_Cms_Back_Publication_Representation$',
    tmplConfig: 'Fl32_Tmpl_Back_Config$',
    render: 'Fl32_Tmpl_Back_Service_Render$',
    respond: 'TeqFw_Web_Back_Helper_Respond$',
    logger: 'TeqFw_Log_Provider$',
})});
