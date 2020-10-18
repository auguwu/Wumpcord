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

const PaginationBuilder = require('./entities/utilities/PaginationBuilder');
const WebhookClient = require('./gateway/WebhookClient');
const RedisProvider = require('./caching/RedisProvider');
const EmbedBuilder = require('./entities/utilities/EmbedBuilder');
const Permissions = require('./util/Permissions');
const { version } = require('../package.json');
const Constants = require('./Constants');
const Provider = require('./caching/Provider');
const commands = require('./commands');
const oauth2 = require('./oauth2');
const Client = require('./gateway/WebSocketClient');
const Util = require('./util/Util');

/**
 * Entrypoint of Wumpcord
 */
module.exports = {
  Constants,
  Client,
  version,
  commands,
  oauth2,
  Permissions,
  Util,
  WebhookClient,
  RedisProvider,
  Provider,
  EmbedBuilder,
  PaginationBuilder
};

/**
 * @typedef {object} MessageFile
 * @prop {Buffer} file The file to send
 * @prop {string} [name] The filename
 */
