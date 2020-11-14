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

const Guild = require('./Guild');
const User = require('./User');

module.exports = class Template {
  /**
   * Creates a new [Template] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {any} data The template data
   */
  constructor(client, data) {
    /**
     * The client instance
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches this [Template] instance
   * @param {any} data The data
   */
  patch(data) {
    /**
     * The template code
     * @type {string}
     */
    this.code = data.code;

    /**
     * The name of the template
     * @type {string}
     */
    this.name = data.name;

    /**
     * The description of the template
     * @type {string}
     */
    this.description = data.description;

    /**
     * How many times the template has been used
     * @type {number}
     */
    this.usageCount = data.usage_count;

    /**
     * The creator's ID
     * @type {string}
     */
    this.creatorID = data.creator_id;

    /**
     * When the template was created at
     * @type {Date}
     */
    this.createdAt = new Date(data.created_at);

    /**
     * When the template was updated at
     * @type {Date}
     */
    this.updatedAt = new Date(data.updated_at);

    /**
     * The sourced guild's ID that the template was created in
     * @type {string}
     */
    this.sourceGuildID = data.source_guild_id;

    /**
     * If the template is unsynced or not
     * @type {boolean}
     */
    this.dirty = Boolean(data.is_dirty);

    /**
     * The creator's data if cached
     * @type {User}
     */
    this.creator = this.client.canCache('user')
      ? this.client.users.get(this.creatorID) || new User(this.client, data.creator)
      : new User(this.client, data.creator);

    /**
     * The sourced guild's data if cached
     * @type {Guild}
     */
    this.sourceGuild = this.client.canCache('guild')
      ? this.client.guilds.get(this.sourceGuildID) || new Guild(this.client, data.serialized_source_guild)
      : new Guild(this.client, data.serialized_source_guild);
  }

  /**
   * Fetches this [Template] to return new data
   */
  fetch() {
    return this.client.rest.dispatch({
      endpoint: `/guilds/templates/${this.code}`,
      method: 'GET'
    }).then((data) => {
      this.patch(data);
      return this;
    });
  }

  toString() {
    return `[Template "https://discord.new/template/${this.code}"]`;
  }
};
