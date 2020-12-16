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
const RestClient = require('../rest/RESTClient');
const Handler = require('./InteractionHandler');
const Command = require('./commands/InteractionCommand');
const Group = require('./commands/InteractionGroup');
const http = require('http');
const { HttpClient } = require('@augu/orchid');

/**
 * A builder class to create a interaction server and listen
 * on requests to Discord and handle them accordingly.
 */
module.exports = class InteractionBuilder {
  /**
   * Creates a new [InteractionBuilder] instance
   * @param {string} id The application ID
   * @param {string} publicKey The public key from your bot's application page
   * @param {string} authToken The authenication token for the REST Client
   */
  constructor(id, publicKey, authToken) {
    /**
     * The list of global interaction commands available
     * @type {Collection<Command>}
     */
    this.globalCommands = new Collection();

    /**
     * List of guild interaction commands available
     * @type {Collection<Command>}
     */
    this.guildCommands = new Collection();

    /**
     * The parent groups for interaction commands
     * @type {Collection<Group>}
     */
    this.groups = new Collection();

    /**
     * The public key to verify requests
     * @type {string}
     */
    this.pubKey = publicKey;

    /**
     * The interactions handler
     * @type {Handler}
     */
    this.handler = new Handler(this);

    /**
     * The server to listen requests from
     * @type {import('http').Server}
     */
    this.server = http.createServer((req, res) => this.handler.handle(req, res));

    /**
     * The http client for making requests to Discord
     */
    // TODO: make a new rest client or update the old rest client?
    this.http = new HttpClient({
      defaults: {
        baseUrl: 'https://discord.com/api/v8',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${authToken}`
        }
      }
    });

    /**
     * The application ID
     */
    this.id = id;
  }

  /**
   * Creates a global interaction command. The command will last
   * for about an hour until it is removed from the application.
   *
   * @param {string} name The command's name
   * @param {string} description The command's description
   * @param {any} [options] The options or arguments to add
   * @returns {Promise<string>} If the command has been created, it'll
   * return the command's ID to edit/delete it.
   */
  async createGlobalCommand(name, description, options = null) {
    if (this.globalCommands.size > 50) throw new TypeError('Limitation for creating a global command has been reached.');

    const command = {
      name,
      description,
      subcommands: new Collection(),
      options
    };

    return this.http.post({
      url: `/applications/${this.id}/commands`,
      data: {
        name: command.name,
        description: command.description,
        options: command.options
      }
    }).then(res => res.json());
  }
};
