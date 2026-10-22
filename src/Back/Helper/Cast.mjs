// @ts-check

/**
 * @namespace Fl32_Cms_Back_Helper_Cast
 * @description Primitive value casting helper.
 *
 * Cast helper for normalizing primitive values (array, string, number, enum).
 */
export default class Fl32_Cms_Back_Helper_Cast {
    /**
     * Creates a new instance.
     */
    constructor() {
        /**
         * Converts input to array. Applies optional item caster.
         *
         * @param {any} data
         * @param {Fl32_Cms_Back_Helper_Cast_ItemCaster} [itemCast]
         * @returns {Array<any>}
         */
        this.array = function (data, itemCast) {
            let arr = [];

            if (Array.isArray(data)) {
                arr = data;
            } else if (data !== null) {
                arr = [data];
            }

            return (typeof itemCast === 'function')
                ? arr.map(itemCast).filter(v => v !== undefined)
                : arr;
        };

        /**
         * Converts input to boolean.
         *
         * @param {any} data
         * @returns {Fl32_Cms_OptionalBoolean}
         */
        this.bool = function (data) {
            if (data === true || data === 'true' || data === 1 || data === '1' || data === 'yes') return true;
            if (data === false || data === 'false' || data === 0 || data === '0' || data === 'no') return false;
            return undefined;
        };

        /**
         * Converts input to float number.
         *
         * @param {any} data
         * @returns {Fl32_Cms_OptionalNumber}
         */
        this.decimal = function (data) {
            const res = Number.parseFloat(data);
            return ((typeof res === 'number') && (!isNaN(res))) ? res : undefined;
        };

        /**
         * Converts input to enum value. Supports case normalization.
         *
         * @param {any} data
         * @param {object} enu
         * @param {Fl32_Cms_Back_Helper_Cast_Enum_Options} [options]
         * @returns {Fl32_Cms_OptionalString}
         */
        this.enum = function (data, enu, options = {}) {
            const {lower, upper} = options;
            let norm = data;

            if (typeof data === 'string') {
                if (upper) {
                    norm = data.toUpperCase();
                } else if (lower) norm = data.toLowerCase();
            }

            const values = Object.values(enu);
            return values.includes(norm) ? norm : undefined;
        };

        /**
         * Converts input to integer.
         *
         * @param {any} data
         * @returns {Fl32_Cms_OptionalNumber}
         */
        this.int = function (data) {
            const norm = (typeof data === 'string') ? data.trim() : data;
            const res = Number.parseInt(norm);
            return ((typeof res === 'number') && (!isNaN(res))) ? res : undefined;
        };

        /**
         * Converts input to string.
         *
         * @param {any} data
         * @returns {Fl32_Cms_OptionalString}
         */
        this.string = function (data) {
            if (typeof data === 'string') {
                return data;
            } else if (typeof data === 'number') {
                return String(data);
            } else if (typeof data === 'boolean') {
                return (data) ? 'true' : 'false';
            }
            return undefined;
        };
    }
}
