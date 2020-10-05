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

const ValidationError = require('./ValidationError');
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
    // do validation here
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
   * @template T Typed-value of a document
   * @param {{ [x in keyof T]?: T[x]; }} query The query
   * @returns {Promise<T | null>} Returns the document or `null` if it doesn't exist
   */
  get(query) {
    throw new TypeError('Missing over-ride function for [Driver.get]');
  }

  /**
   * Updates the document in real-time
   * @template T Typed-value of a document
   * @param {{ [x in keyof T]?: T[x]; }} filter The filter to find a document
   * @param {{ [x in UpdateFilters]?: { [P in keyof T]?: T[P]; } }} query The query
   * @returns {Promise<UpdateResult | null>} Returns the result of the updated values
   * or `null` if the document's doesn't exist
   */
  update(filter, query) {
    throw new TypeError('Missing over-ride function for [Driver.update]');
  }

  /**
   * Creates a document, checks for validation errors provided by [Driver#schema],
   * and inserts it to the database
   *
   * @template T Typed-value of a document
   * @param {{ [x in keyof T]: T[x]; }} document The document
   * @returns {Promise<InsertResult | null>} Returns the result of the inserted document
   * or `null` if the document's doesn't exist
   */
  insert(document) {
    throw new TypeError('Missing over-ride function for [Driver.insert]');
  }

  /**
   * Deletes a document and removes it from cache
   * @template T Typed-value of a document
   * @param {{ [Q in keyof T]?: T[Q]; }} filter The filter
   * @returns {Promise<boolean>} Returns a boolean value if it was deleted or not
   */
  delete(filter) {
    throw new TypeError('Missing over-ride function for [Driver.delete]');
  }

  /**
   * Checks if a document follows the schema
   * @template T Typed-value of a document
   * @param {T} document The document
   * @returns {ValidationError[]} Returns an Array of validation errors, if there is any
   */
  abide(document) {
    // logic here
  }

  /**
   * Fetches all the documents in a collection
   * @template T Typed-value of the document(s)
   * @param {string} collection The collection
   * @returns {Promise<T[]>}
   * @abstract
   */
  all(collection) {
    throw new SyntaxError('Missing over-ride function for [Driver.all]');
  }
};

/**
 * @typedef {T | Promise<T>} MaybePromise
 * @template T
 */

/**
 * @typedef {'string' | 'number' | 'boolean' | 'date' | 'object'} SupportedTypes
 * @typedef {'set' | 'push' | 'pull' | 'inc' | 'dec'} UpdateFilters
 *
 * @typedef {{ [collection: string]: CollectionSchema }} DriverSchema
 *
 * @typedef {object} CollectionSchema
 * @prop {{ [table: string]: { [key: string]: SupportedTypes | DocumentSchema } }} tables The schema for all tables
 * @prop {string} column The column to use (if using SQL)
 *
 * @typedef {object} DocumentSchema
 * @prop {boolean} [nullable=false] If this key is nullable or not (can pass in `null`/`undefined`)
 * @prop {any} [default=undefined] The default value if the key wasn't passed in using [Driver.create/2] or [Driver.update/1]
 * @prop {boolean} [size=0] The size of an Array or String (only supported in SQL drivers, not NoSQL)
 * @prop {SupportedTypes} type The type to use
 *
 * @typedef {object} DriverOptions
 * @prop {DriverSchema} [schema=undefined] Proper schema to validate creating & updating documents
 * @prop {string} [socket=undefined] Path to use to connect to a database, using a Unix socket
 * @prop {AuthenticationDetails} [auth=undefined] The authentication details
 * @prop {string} host The host to use
 * @prop {number} port The port to use
 * @prop {boolean} [tls=false] If we should use a TLS connection, default is `false`
 *
 * @typedef {object} Result
 * @prop {import('./ValidationError').Code} [code] The code, if there is one
 * @prop {import('./ValidationError')[]} errors Any errors from validating
 * @prop {import('./Document')} [document] The document updated
 *
 * @typedef {Result} InsertResult
 * @typedef {Result} UpdateResult
 */
