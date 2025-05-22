/**
 * Simple logger implementation that delegates to the native console.
 */
export default class Fl32_Cms_Back_Logger {
    /**
     * Logs an error message.
     * @param {...any} args - The error message or data.
     */
    error(...args) {
        console.error('[ERROR]', ...args);
    }

    /**
     * Logs a warning message.
     * @param {...any} args - The warning message or data.
     */
    warn(...args) {
        console.warn('[WARN]', ...args);
    }

    /**
     * Logs an informational message.
     * @param {...any} args - The informational message or data.
     */
    info(...args) {
        console.info('[INFO]', ...args);
    }

    /**
     * Logs a debug message.
     * @param {...any} args - The debug message or data.
     */
    debug(...args) {
        console.debug('[DEBUG]', ...args);
    }

    /**
     * Logs a trace message.
     * @param {...any} args - The trace message or data.
     */
    trace(...args) {
        console.trace('[TRACE]', ...args);
    }

    /**
     * Logs an exception with optional additional context.
     * @param {Error} exception - The exception to log.
     * @param {...any} context - Additional context or metadata.
     */
    exception(exception, ...context) {
        console.error('[EXCEPTION]', exception.stack || exception.toString(), ...context);
    }
}
