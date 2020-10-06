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

const Driver = require('../Driver');

/** @type {typeof import('mongodb')} */
let mongodb;

try {
  mongodb = require('mongodb');
} catch(ex) {
  throw new SyntaxError('`mongodb` must be installed to use the [MongoDB] driver');
}

/**
 * @extends {Driver<import('mongodb').MongoClient>}
 */
module.exports = class MongoDriver extends Driver {
  /**
   * Creates a new [MongoDriver] instance
   * @param {import('../Driver').DriverOptions} options The options to use
   */
  constructor(options) {
    // TODO: test with unix sockets & tls connections, PR if you do it!
    if (options.socket !== undefined) throw new TypeError('Unix socket support is not enabled in [MongoDriver]');
    if (options.tls !== undefined) throw new TypeError('TLS support is not enabeld in [MongoDriver]');

    super(options);

    /**
     * The provider name
     * @type {string}
     */
    this.provider = 'MongoDB';

    /**
     * The current collection the user is on
     * @type {import('mongodb').Collection}
     */
    this.collection = null;

    /**
     * The database to fetch data from
     * @type {import('mongodb').Db}
     */
    this.db = null;
  }

  /**
   * Create a connection with the database
   * @returns {import('../Driver').MaybePromise<void>}
   */
  connect() {
    if (this.connection && this.connection.isConnected()) {
      this.emit('warn', 'We already established a connection, skipping');
      return;
    }

    this.emit('debug', 'Now connecting to MongoDB...');

    return mongodb.connect(`mongodb://${this.host}:${this.port}`, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      authSource: this.auth !== undefined && this.auth.hasOwnProperty('source') ? this.auth.source : undefined,
      auth: this.auth !== undefined ? {
        password: this.auth.password,
        user: this.auth.username
      } : undefined
    }).then(client => {
      /**
       * Fires when we establish a connection
       * @fires connect
       * @param {string} url The URL we used
       * @param {boolean} tls If we used a TLS connection
       * @param {boolean} socket If we used a unix socket to connect
       */
      this.emit('connect', `mongodb://${this.host}:${this.port}`, false, false);

      this.connection = client;
      this.db = client.db(this.name);
    }).catch(error => this.emit('error', error));
  }

  /**
   * Disconnects the connection and properly disposes all collections
   */
  async dispose() {
    if (!this.connection) {
      this.emit('warn', 'There is no set established connection, skipping');
      return;
    }

    return this.connection.close()
      .then(() => {
        /**
         * Emitted when the connection has closed successfully
         * @param {boolean} success If it was a successful disconnect
         * @param {any} [error] The error if provided
         */
        this.emit('close', true);

        this.connection = undefined;
        this.collection = undefined;
        this.db = undefined;
      })
      .catch(error => this.emit('close', false, error));
  }

  /**
   * Returns a document or `null` if not provided
   * @template U Typed-value of a document
   * @param {string} collection The collection
   * @param {{ [x in keyof U]?: U[x]; }} query The query
   * @returns {Promise<U | null>} Returns the document or `null` if it doesn't exist
   */
  get(query) {
    if (!this.collection) throw new SyntaxError('You must switch to a collection to find data, Use MongoDriver.switch to switch!');

    return this.collection.findOne(query);
  }

  /**
   * Updates the document in real-time
   * @template T Typed-value of a document
   * @param {string} collection The collection
   * @param {{ [x in keyof T]?: T[x]; }} filter The filter to find a document
   * @param {{ [x in UpdateFilters]?: { [P in keyof T]?: T[P]; } }} query The query
   * @returns {Promise<boolean>} Returns the result of the updated values or a error thrown
   */
  async update(filter, query) {
    const old = await this.get(filter);
    if (!old) throw new TypeError('Filter didn\'t provide with any results');

    return this.collection.updateOne(filter, query)
      .then(() => true)
      .catch(() => false);
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
    if (!this.collection) throw new SyntaxError('You must switch to a collection to find data, Use MongoDriver.switch to switch!');

    // idk mate
    return this.collection.insertOne(document);
  }

  /**
   * Deletes a document and removes it from cache
   * @template T Typed-value of a document
   * @param {string} collection The collection
   * @param {{ [Q in keyof T]?: T[Q]; }} filter The filter
   * @returns {Promise<boolean>} Returns a boolean value if it was deleted or not
   */
  delete(filter) {
    if (!this.collection) throw new SyntaxError('You must switch to a collection to find data, Use MongoDriver.switch to switch!');

    return this.collection.deleteOne(filter);
  }

  /**
   * Fetches all the documents in a collection
   * @template T Typed-value of the document(s)
   * @param {string} collection The collection
   * @returns {Promise<T[]>}
   * @abstract
   */
  all() {
    if (!this.collection) throw new SyntaxError('You must switch to a collection to find data, Use MongoDriver.switch to switch!');

    return this.collection.findOne({});
  }
};

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
 * @prop {string} [source] The source database to use
 */
