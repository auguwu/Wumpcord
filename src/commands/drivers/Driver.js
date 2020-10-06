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

const EventBus = require('../../util/EventBus');

/**
 * Represents a [Driver] class to handle concurrent database sessions
 * @template T The connection class to use
 *
 * ### Built-in Drivers
 * - MongoDB
 * - PostgreSQL
 */
module.exports = class Driver extends EventBus {
  /**
   * Creates a new [Driver] instance
   * @param {DriverOptions} opts The options to use
   */
  constructor(opts) {
    super();

    this.constructor._validate(opts);

    /**
     * The current connection of the driver, must populate in [Driver.connect/0]
     * @type {?T}
     */
    this.connection = undefined;

    /**
     * Socket path if we are using a Unix socket
     * @type {?string}
     */
    this.socket = opts.socket;

    /**
     * The provider's name, will return `null` if it's [Driver]
     * @type {string}
     */
    this.provider = null;

    /**
     * Schema to abide when creating or updating documents for safer validation
     * @type {?DriverSchema}
     */
    this.schema = opts.schema || null;

    /**
     * The host to connect to
     * @type {string}
     */
    this.host = opts.host;

    /**
     * The port to connect to
     * @type {number}
     */
    this.port = opts.port;

    /**
     * The name of the database
     * @type {string}
     */
    this.name = name;

    /**
     * Authenication details for the service
     * @type {AuthenticationDetails}
     */
    this.auth = opts.auth || null;

    /**
     * If the driver supports TLS connections
     * @type {boolean}
     */
    this.tls = opts.tls || false;
  }

  /**
   * Validates the options
   * @param {DriverOptions} opts The driver's options
   */
  static _validate(opts) {
    if (!opts) throw new SyntaxError('Missing `opts` object');
    if (typeof opts !== 'object' && !Array.isArray(opts)) throw new SyntaxError(`Expected \`object\`, received ${typeof opts}`);
    if (!opts.name) throw new TypeError('Missing `name` in `options`');

    const isUnixSocket = opts.socket !== undefined;
    if (isUnixSocket && (opts.host !== undefined || opts.port !== undefined)) throw new TypeError('`socket` was provided but also a `host` and `port`? (https://docs.augu.dev/Wumpcord/errors#socket-but-host-port)');
    else if (!opts.host || !opts.port) throw new TypeError('Missing `host` and `port` in `options`');

    if (typeof opts.name !== 'string') throw new TypeError(`Expected \`string\` but gotten ${typeof opts.name}`);
    if (opts.tls !== undefined && typeof opts.tls !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.tls}`);
    if (typeof opts.port !== 'number' || Number.isNaN(opts.port)) throw new TypeError('`port` was not a number or isn\'t specified');
    if (typeof opts.host !== 'string') throw new TypeError(`Expected \`string\`, received ${typeof opts.host}`);
    if (opts.auth && (typeof opts.auth !== 'object' && !Array.isArray(opts.auth))) throw new TypeError(`Expected \`object\`, received ${typeof opts.auth}`);
    if (opts.schema && (typeof opts.schema !== 'object' && !Array.isArray(opts.schema))) throw new TypeError(`Expected \`object\`, received ${typeof opts.schema}`);
    if (opts.socket && typeof opts.socket !== 'string') throw new TypeError(`Expected \`string\`, received ${typeof opts.socket}`);
  }

  /**
   * Create a connection with the database
   * @returns {MaybePromise<void>}
   */
  connect() {
    throw new SyntaxError('Missing over-ride function for [Driver.connect]');
  }

  /**
   * Disconnects the connection and properly disposes all collections
   */
  dispose() {
    throw new SyntaxError('Missing over-ride function for [Driver.dispose]');
  }

  /**
   * Returns a document or `null` if not provided
   * @template U Typed-value of a document
   * @param {string} collection The collection
   * @param {{ [x in keyof U]?: U[x]; }} query The query
   * @returns {Promise<U | null>} Returns the document or `null` if it doesn't exist
   */
  get(query) {
    throw new TypeError('Missing over-ride function for [Driver.get]');
  }

  /**
   * Updates the document in real-time
   * @template T Typed-value of a document
   * @param {string} collection The collection
   * @param {{ [x in keyof T]?: T[x]; }} filter The filter to find a document
   * @param {{ [x in UpdateFilters]?: { [P in keyof T]?: T[P]; } }} query The query
   * @returns {Promise<T>} Returns the result of the updated values or a error thrown
   */
  update(filter, query) {
    throw new TypeError('Missing over-ride function for [Driver.update]');
  }

  /**
   * Creates a document, checks for validation errors provided by [Driver#schema],
   * and inserts it to the database
   *
   * @template T Typed-value of a document
   * @param {string} collection The collection
   * @param {{ [x in keyof T]: T[x]; }} document The document to insert
   * @returns {Promise<T>} Returns the result of the inserted document or a error thrown
   */
  insert(document) {
    throw new TypeError('Missing over-ride function for [Driver.insert]');
  }

  /**
   * Deletes a document and removes it from cache
   * @template T Typed-value of a document
   * @param {string} collection The collection
   * @param {{ [Q in keyof T]?: T[Q]; }} filter The filter
   * @returns {Promise<boolean>} Returns a boolean value if it was deleted or not
   */
  delete(filter) {
    throw new TypeError('Missing over-ride function for [Driver.delete]');
  }

  /**
   * Fetches all the documents in a collection
   * @template T Typed-value of the document(s)
   * @param {string} collection The collection
   * @returns {Promise<T[]>}
   * @abstract
   */
  all() {
    throw new SyntaxError('Missing over-ride function for [Driver.all]');
  }
};

/**
 * @typedef {T | Promise<T>} MaybePromise
 * @template T
 */

/**
 * @typedef {'set' | 'push' | 'pull' | 'inc' | 'dec'} UpdateFilters
 *
 * @typedef {object} DriverOptions
 * @prop {string} [socket=undefined] Path to use to connect to a database, using a Unix socket
 * @prop {AuthenticationDetails} [auth=undefined] The authentication details
 * @prop {string} name The database name
 * @prop {string} host The host to use
 * @prop {number} port The port to use
 * @prop {boolean} [tls=false] If we should use a TLS connection, default is `false`
 *
 * @typedef {object} AuthenticationDetails
 * @prop {string} [username] The username
 * @prop {string} [password] The password to use
 */
