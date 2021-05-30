/**
 * Copyright (c) 2020-2021 August
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

import type { APIEmoji, RESTPatchAPIGuildEmojiJSONBody, Snowflake } from 'discord-api-types';
import type { WebSocketClient } from '../Client';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

/**
 * https://discord.com/developers/docs/resources/emoji#emoji-object-emoji-structure
 */
export interface APIGuildEmoji extends APIEmoji {
  /**
   * The guild ID this emoji lives
   */
  guild_id?: string; // eslint-disable-line camelcase
}

/**
 * https://discord.com/developers/docs/resources/emoji#modify-guild-emoji-json-params
 */
export interface ModifyEmojiOptions {
  /**
   * Roles allowed to use this emoji
   */
  roles?: string[];

  /**
   * The name of the emoji to set
   */
  name?: string;
}

/**
 * https://discord.com/developers/docs/resources/emoji#emoji-resource
 */
export class Emoji extends BaseEntity<APIGuildEmoji> {
  /**
   * Whether this emoji should be wrapped in colons
   */
  public requireColons?: boolean;

  /**
   * If this emoji is available to be used, it can be `false` due to loss of Server Boosts
   */
  public available?: boolean;

  /**
   * Whether this emoji is animated
   */
  public animated?: boolean;

  /**
   * Whether this emoji is managed by a integration
   */
  public managed?: boolean;

  /**
   * The [WebSocketClient] attached to this emoji.
   */
  private client: WebSocketClient;

  /**
   * The guild's ID that this emoji belongs to. Returns `undefined`
   * if it wasn't constructed by the library (since emojis from REST doesn't return the guild ID).
   */
  public guildID?: string;

  /**
   * The name of the emoji, returns `null` if they're used in reaction emojis.
   */
  public name!: string | null;

  /**
   * The user who created this emoji.
   */
  public user?: User;

  constructor(client: WebSocketClient, data: APIGuildEmoji) {
    super(data.id as any);

    this.client = client;
    this.patch(data);
  }

  patch(data: Partial<APIGuildEmoji>) {
    if (data.require_colons !== undefined)
      this.requireColons = data.require_colons;

    if (data.available !== undefined)
      this.available = data.available;

    if (data.animated !== undefined)
      this.animated = data.animated;

    if (data.managed !== undefined)
      this.managed = data.managed;

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.user !== undefined)
      this.user = this.client.users.put(new User(this.client, data.user));

    if (data.name !== undefined)
      this.name = data.name;
  }

  /**
   * Updates any data related to this emoji.
   * @param param0.roles The roles to set
   * @param param0.name The name of the emoji to set it as
   */
  modify({
    roles,
    name
  }: ModifyEmojiOptions) {
    if (this.guildID === undefined)
      throw new TypeError('cannot modify emoji due to guild id being undefined.');

    return this.client.rest.dispatch<RESTPatchAPIGuildEmojiJSONBody, APIEmoji>({
      endpoint: '/guilds/:guildID/emojis/:emojiID',
      method: 'PATCH',
      query: {
        guildID: this.guildID,
        emojiID: this.id
      },
      data: {
        roles: roles as Snowflake[],
        name
      }
    });
  }

  /**
   * Returns the guild that owns this emoji
   */
  get guild() {
    return null;
  }

  toString() {
    return `<${this.animated === true ? 'a:' : ':'}${this.name}:${this.id}>`;
  }
}
