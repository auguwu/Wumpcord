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

/**
 * Represents the command's message class, that has external
 * options to use when running a command
 */
module.exports = class CommandContext {
  /**
   * Creates a new [CommandContext] instance
   * @param {import('./CommandClient')} client The client
   * @param {import('../entities/Message')} msg The message
   */
  constructor(client, msg) {
    /**
     * The message
     * @type {import('../entities/Message')}
     */
    this.message = msg;

    /**
     * The client itself
     * @type {import('./CommandClient')}
     */
    this.client = client;
  }

  /**
   * Creates a new message in a channel
   * @param {string | CreateMessageOptions | Buffer | MessageFile} content The content to send
   * @param {CreateMessageOptions | Buffer | MessageFile} [options] Any additional options
   */
  send(content, options) {
    return this.message.channel.send(content, options);
  }

  /**
   * Gets the guild or `null` if can't be cached
   */
  get guild() {
    return this.message.guild;
  }

  /**
   * Gets the channel
   */
  get channel() {
    return this.message.channel;
  }

  /**
   * Gets the author of the message
   */
  get author() {
    return this.message.author;
  }
};

/**
 * @typedef {import('../entities/channel/TextableChannel').CreateMessageOptions} CreateMessageOptions
 * @typedef {import('../entities/channel/TextableChannel').MessageFile} MessageFile
 */
