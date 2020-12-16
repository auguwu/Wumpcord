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

const { Collection } = require('@augu/immutable');
const Command = require('./Command');

/**
 * Helper utility class to create interaction commands
 */
module.exports = class InteractionHelper {
  /**
   * Creates a new [InteractionHelper] instance
   * @param {import('../gateway/WebSocketClient')} client The WebSocket client instance
   * @param {string} id The ID of the application
   */
  constructor(client, id) {
    /**
     * The list of global commands available, use `InteractionHelper.getGlobalCommands`
     * to add to the cache.
     *
     * @type {Collection<Command>}
     */
    this.globalCommands = new Collection();

    /**
     * The list of guild commands available, use `InteractionHelper.getGuildCommands`
     * to add to the cache
     *
     * @type {Collection<Collection<Command>>}
     */
    this.guildCommands = new Collection();

    /**
     * The client instance
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    /**
     * The ID of the application
     * @type {string}
     */
    this.id = id;
  }

  /**
   * Fetches the list of global commands available to this application,
   * all commands have a TTL (time to last) of 1 hour, so old commands
   * that doesn't exist will be removed from cache.
   */
  getGlobalCommands() {
    return this.client.rest.dispatch({
      endpoint: `/applications/${this.id}/commands`,
      method: 'GET'
    }).then(data => data.map(command => new Command(command)));
  }

  /**
   * Fetches the list of guild commands available to this application.
   * @param {string} guildID The guild's ID to fetch the commands
   */
  getGuildCommands(guildID) {
    return this.client.rest.dispatch({
      endpoint: `/applications/${this.id}/guilds/${guildID}/commands`,
      method: 'GET'
    })
      .then(data => data.map(command => new Command(command)))
      .catch(error => {
        if (error.message.indexOf('Missing Access') !== -1) throw new TypeError('Application must be invited in guild using the "applications.commands" scope.');

        throw error;
      });
  }

  /**
   * Creates a guild command to this application
   * @param {string} guildID The guild's ID
   * @param {any} metadata The command's metadata
   */
  createGuildCommand(guildID, metadata) {
    return this.client.rest.dispatch({
      endpoint: `/applications/${this.id}/guilds/${guildID}/commands`,
      method: 'POST',
      data: metadata
    }).then(data => {
      const command = new Command(data);
      this.guildCommands.set(metadata.name, command);

      return command;
    });
  }

  /**
   * Creates a global command to this application
   * @param {any} metadata The command's metadata
   */
  createGlobalCommand(metadata) {
    return this.client.rest.dispatch({
      endpoint: `/applications/${this.id}/commands`,
      method: 'POST',
      data: metadata
    }).then(data => {
      const command = new Command(data);
      this.globalCommands.set(metadata.name, command);

      return command;
    });
  }
};
