/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** for [Utilities.lodash] namespace */
const hasUnicodeWord = RegExp.prototype.test.bind(
  /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/
);

/** Used to match words composed of alphanumeric characters. */
const reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

/** Used to compose unicode character classes. */
const rsAstralRange = '\\ud800-\\udfff';
const rsComboMarksRange = '\\u0300-\\u036f';
const reComboHalfMarksRange = '\\ufe20-\\ufe2f';
const rsComboSymbolsRange = '\\u20d0-\\u20ff';
const rsComboMarksExtendedRange = '\\u1ab0-\\u1aff';
const rsComboMarksSupplementRange = '\\u1dc0-\\u1dff';
const rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange + rsComboMarksExtendedRange + rsComboMarksSupplementRange;
const rsDingbatRange = '\\u2700-\\u27bf';
const rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff';
const rsMathOpRange = '\\xac\\xb1\\xd7\\xf7';
const rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf';
const rsPunctuationRange = '\\u2000-\\u206f';
const rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000';
const rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde';
const rsVarRange = '\\ufe0e\\ufe0f';
const rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

/** Used to compose unicode capture groups. */
const rsApos = '[\'\u2019]';
const rsBreak = `[${rsBreakRange}]`;
const rsCombo = `[${rsComboRange}]`;
const rsDigit = '\\d';
const rsDingbat = `[${rsDingbatRange}]`;
const rsLower = `[${rsLowerRange}]`;
const rsMisc = `[^${rsAstralRange}${rsBreakRange + rsDigit + rsDingbatRange + rsLowerRange + rsUpperRange}]`;
const rsFitz = '\\ud83c[\\udffb-\\udfff]';
const rsModifier = `(?:${rsCombo}|${rsFitz})`;
const rsNonAstral = `[^${rsAstralRange}]`;
const rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
const rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
const rsUpper = `[${rsUpperRange}]`;
const rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
const rsMiscLower = `(?:${rsLower}|${rsMisc})`;
const rsMiscUpper = `(?:${rsUpper}|${rsMisc})`;
const rsOptContrLower = `(?:${rsApos}(?:d|ll|m|re|s|t|ve))?`;
const rsOptContrUpper = `(?:${rsApos}(?:D|LL|M|RE|S|T|VE))?`;
const reOptMod = `${rsModifier}?`;
const rsOptVar = `[${rsVarRange}]?`;
const rsOptJoin = `(?:${rsZWJ}(?:${[rsNonAstral, rsRegional, rsSurrPair].join('|')})${rsOptVar + reOptMod})*`;
const rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])';
const rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])';
const rsSeq = rsOptVar + reOptMod + rsOptJoin;
const rsEmoji = `(?:${[rsDingbat, rsRegional, rsSurrPair].join('|')})${rsSeq}`;

const reUnicodeWords = RegExp([
  `${rsUpper}?${rsLower}+${rsOptContrLower}(?=${[rsBreak, rsUpper, '$'].join('|')})`,
  `${rsMiscUpper}+${rsOptContrUpper}(?=${[rsBreak, rsUpper + rsMiscLower, '$'].join('|')})`,
  `${rsUpper}?${rsMiscLower}+${rsOptContrLower}`,
  `${rsUpper}+${rsOptContrUpper}`,
  rsOrdUpper,
  rsOrdLower,
  `${rsDigit}+`,
  rsEmoji
].join('|'), 'g');

/**
 * External utilities made for development purposes
 */
module.exports = class Utilities {
  constructor() {
    throw new SyntaxError('Wumpcord.Utilities is not made to be a constructable-class; please refrain using `new`.');
  }

  /**
   * Gets an option from an object
   * @template T The object itself
   * @template U The default value, if any
   * @param {keyof T} prop The property to find
   * @param {U} defaultValue The default value
   * @param {T} [options] The options to use
   * @returns {U} The value itself or the default value if not found
   * @arity Wumpcord.Utilities.getOption/3
   */
  static get(prop, defaultValue, options) {
    if (options === undefined || options === null) return defaultValue;
    else if (options.hasOwnProperty(prop)) return options[prop];
    else return defaultValue;
  }

  /**
   * Halts the process asynchronously for an amount of time
   * @param {number} ms The number of milliseconds to halt the process
   * @arity Wumpcord.Utilities.sleep/1
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formats the allowed mentions property
   * @param {import('../gateway/WebSocketClient').ClientOptions} options The client options
   * @param {import('../gateway/WebSocketClient').AllowedMentions} allowed The allowed options
   * @arity Wumpcord.Utilities.formatAllowedMentions/2
   */
  static formatAllowedMentions(options, allowed) {
    if (!allowed) return options.allowedMentions;

    const result = { parse: [] };
    if (allowed.everyone) result.parse.push('everyone');

    if (allowed.roles === true) result.parse.push('roles');
    else if (Array.isArray(allowed.roles)) {
      if (allowed.roles.length > 100) throw new TypeError('Allowed role mentions can\'t go over 100');

      result.roles = allowed.roles;
    }

    if (allowed.users === true) result.parse.push('users');
    else if (Array.isArray(allowed.users)) {
      if (allowed.users.length > 100) throw new TypeError('Allowed users mentions can\'t go over 100');

      result.users = allowed.users;
    }

    return result;
  }

  /**
   * Merges 2 objects into a huge one
   * @template T The object
   * @param {T} given The given object
   * @param {T} def The default
   * @returns {T} The returned object
   * @arity Wumpcord.Utilities.merge/1
   */
  static merge(given, def) {
    if (!given) return def;
    for (const key in def) {
      if (!Object.hasOwnProperty.call(given, key) || given[key] === undefined) given[key] = def[key];
      else if (given[key] === Object(given[key])) given[key] = Utilities.merge(def[key], given[key]);
    }

    return given;
  }

  /**
   * @template T: Data representation
   * @param {T[]} entries
   * @param {number} chunkSize
   * @arity Wumpcord.Utilities.chunk/2
   * @returns {Array<Array<T>>}
   * @credit https://github.com/DevYukine/Kurasuta/blob/master/src/Util/Util.ts#L9
   */
  static chunk(entries, chunkSize) {
    const result = [];
    const amount = Math.floor(entries.length / chunkSize);
    const mod = entries.length % chunkSize;

    for (let i = 0; i < chunkSize; i++)
      result[i] = entries.splice(0, i < mod ? amount + 1 : amount);

    return result;
  }

  /**
   * Makes keys of an object to camelCase, dependant on the size,
   * this function can be O(N), so beware!
   *
   * @template T: The object
   * @template U: The camelCase-like object
   * @param {T} obj The object to convert
   * @returns {U} The object but with the keys as camelCase
   * @arity Wumpcord.Utilities.toCamelcase/1
   */
  static toCamelCase(obj) {
    /** @type {U} */
    const object = {};
    const keys = Object.keys(obj);

    // Return an empty object
    if (!keys.length) return object;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      object[this.lodash.camelcase(key)] = obj[key];
    }

    return object;
  }

  /**
   * Returns the formed URL to fetch audit logs
   * @param {string} guildID The guild's ID
   * @param {import('../entities/Guild').FetchAuditLogsOptions} opts The options
   * @returns {string} The formed URL
   */
  static getAuditLogUrl(guildID, opts) {
    let url = `/guilds/${guildID}/audit-logs`;
    if (!Object.keys(opts).length) return url;

    const entries = Object.entries(opts);
    for (let i = 0; i < entries.length; i++) {
      const marker = i === 0 ? '?' : '&';
      const [key, value] = entries[i];

      url += `${marker}${key}=${value}`;
    }

    return url;
  }

  /**
   * Plucks out a property if it exists from an object
   * @template T The data object
   * @param {T} obj The object
   * @param {keyof T} key The key to pluck out
   * @returns {Exclude<T, keyof T>} The object with the plucked out object
   * @arity Wumpcord.Utilities.pluck/2
   */
  static pluck(obj, key) {
    for (const k in obj) {
      if (k === key) {
        delete obj[k];
        break; // let's break it
      }
    }

    return obj;
  }

  /**
   * Checks if `value` is a Promise
   * @param {unknown} value The value
   * @returns {value is Promise<any>} Returns a boolean-represented value
   * if it is a promise or not
   */
  static isPromise(value) {
    return (
      value instanceof Promise &&
      typeof value.then === 'function' &&
      typeof value.catch === 'function'
    );
  }

  /**
   * Finds a object's key from it's initial value
   * @template T The data object
   * @param {T} obj The object
   * @param {T[keyof T]} key The key to find
   * @returns {keyof T} The value found or `null` if not specified
   */
  static getKey(obj, key) {
    return Object.keys(obj).find(val => obj[val] === key);
  }

  /**
   * Set of lodash functions that are modified to the library's
   * expectations so we don't bundle in a huge library into the
   * project.
   *
   * @credit [Lodash Team](https://github.com/lodash/lodash)
   * @type {LodashNamespace}
   */
  static get lodash() {
    return {
      unicodeWords(str) {
        return str.match(reUnicodeWords) || [];
      },

      firstUpper(str) {
        return str
          .split('')
          .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
          .join('');
      },

      camelcase(str) {
        return this.words(str.replace(/['\u2019']/g, '')).reduce((result, word, index) => {
          word = word.toLowerCase();
          return result + (index ? this.firstUpper(word) : word);
        }, '');
      },

      words(str, pattern) {
        if (pattern === undefined) {
          const result = hasUnicodeWord(str) ? this.unicodeWords(str) : this.asciiWords(str);
          return result || [];
        }

        return str.match(pattern) || [];
      },

      asciiWords(str) {
        return str.match(reAsciiWord) || [];
      }
    };
  }
};

/**
 * @typedef {object} LodashNamespace Namespace for [Utilities.lodash] getter
 * @prop {(str: string) => string[]} unicodeWords Splits a Unicode `string` into an array of its words
 * @prop {(str: string) => string[]} asciiWords Converts `string` to an array of ascii-related characters
 * @prop {(str: string) => string} firstUpper Returns the first letter of a string as uppercase
 * @prop {(str: string) => string} camelcase Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase)
 * @prop {(str: string, pattern?: RegExp) => string[]} words Splits `string` into an array of its words
 */
