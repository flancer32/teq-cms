/**
 * Cast helper for normalizing primitive values (array, string, number, enum).
 */
export default class Fl32_Cms_Back_Helper_Cast {
    /* eslint-disable jsdoc/require-param-description */
    /**
     * Converts input to array. Applies optional item caster.
     *
     * @param {*} data
     * @param {function(*): *} [itemCast]
     * @returns {Array}
     */
    array(data, itemCast) {
        let arr = [];

        if (Array.isArray(data)) {
            arr = data;
        } else if (data !== null) {
            arr = [data];
        }

        return (typeof itemCast === 'function')
            ? arr.map(itemCast).filter(v => v !== undefined)
            : arr;
    }

    /**
     * Converts input to boolean.
     *
     * Accepts:
     * - true, "true", 1, "1", "yes" => true
     * - false, "false", 0, "0", "no" => false
     *
     * @param {*} data
     * @returns {boolean|undefined}
     */
    bool(data) {
        if (data === true || data === 'true' || data === 1 || data === '1' || data === 'yes') return true;
        if (data === false || data === 'false' || data === 0 || data === '0' || data === 'no') return false;
        return undefined;
    }

    /**
     * Converts input to float number.
     *
     * @param {*} data
     * @returns {number|undefined}
     */
    decimal(data) {
        const res = Number.parseFloat(data);
        return ((typeof res === 'number') && (!isNaN(res))) ? res : undefined;
    }

    /**
     * Converts input to enum value. Supports case normalization.
     *
     * @param {*} data
     * @param {object} enu
     * @param {object} [params]
     * @param {boolean} [params.lower]
     * @param {boolean} [params.upper]
     * @returns {string|undefined}
     */
    enum(data, enu, {lower, upper} = {}) {
        let norm = data;

        if (typeof data === 'string') {
            if (upper) {
                norm = data.toUpperCase();
            } else if (lower) norm = data.toLowerCase();
        }

        const values = Object.values(enu);
        return values.includes(norm) ? norm : undefined;
    }

    /**
     * Converts input to integer.
     *
     * @param {*} data
     * @returns {number|undefined}
     */
    int(data) {
        const norm = (typeof data === 'string') ? data.trim() : data;
        const res = Number.parseInt(norm);
        return ((typeof res === 'number') && (!isNaN(res))) ? res : undefined;
    }

    /**
     * Converts input to string.
     *
     * @param {*} data
     * @returns {string|undefined}
     */
    string(data) {
        if (typeof data === 'string') {
            return data;
        } else if (typeof data === 'number') {
            return String(data);
        } else if (typeof data === 'boolean') {
            return (data) ? 'true' : 'false';
        }
        return undefined;
    }
}
