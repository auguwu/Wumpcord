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

const { verify } = require('./utils');
const EventBus = require('../util/EventBus');

/**
 * Subclass to handle all requests from Discord
 */
module.exports = class InteractionHandler extends EventBus {
  /**
   * Creates a new [InteractionHandler] instance
   * @param {import('./InteractionBuilder')} builder The builder instance
   */
  constructor(builder) {
    super();

    /**
     * The builder instance
     * @private
     * @type {import('./InteractionBuilder')}
     */
    this.builder = builder;
  }

  /**
   * Handles the request from Discord -> Us
   * @param {import('http').IncomingMessage} req The request from Discord
   * @param {import('http').ServerResponse} res The response instance
   */
  async handle(req, res) {
    // noop
  }
};

// headers from discord docs
/*
const signature = req.get('X-Signature-Ed25519');
const timestamp = req.get('X-Signature-Timestamp');
const body = req.rawBody; // rawBody is expected to be a string, not raw bytes
*/
