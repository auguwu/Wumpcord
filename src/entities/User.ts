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

/* eslint-disable camelcase */

import type { APIUser, APIChannel, RESTPostAPICurrentUserCreateDMChannelJSONBody } from 'discord-api-types';
import type { MessageContent, MessageContentOptions } from '../types';
import type { WebSocketClient } from '../gateway/WebSocketClient';
import { DynamicImage } from './inheritable/DynamicImage';
import { BaseEntity } from './BaseEntity';
import { UserFlags } from '../Constants';
import { Channel } from './Channel';

/**
 * https://discord.com/developers/docs/resources/user
 */
class User extends BaseEntity<APIUser> {
  /**
   * The user's 4-digit discord tag
   */
  public discriminator!: string;

  /**
   * The DM channel that the bot and this [[User]] are connected to, useful for
   * [[User#createDM]], [[User#leaveDM]], or [[User#send]]
   */
  private dmChannel?: any;

  /**
   * The user's username, not unique across the platform
   */
  public username!: string;

  /**
   * If the user is a official Discord system account or not
   */
  public system!: boolean;

  /**
   * The [[WebSocketClient]] attached to this [[User]]
   */
  public client: WebSocketClient;

  /**
   * The user's avatar has, maybe null if none is specified.
   */
  public avatar!: string | null;

  /**
   * The public flags on a user account by it's bitfield
   */
  public flags?: number;

  /**
   * If the user is a bot account
   */
  public bot!: boolean;

  constructor(client: WebSocketClient, data: APIUser) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: APIUser) {
    if (data.discriminator !== undefined)
      this.discriminator = data.discriminator;

    if (data.username !== undefined)
      this.username = data.username;

    if (data.avatar !== undefined)
      this.avatar = data.avatar;

    // don't know why you would call patch but hey
    this.system = data.system ?? this.system ?? false;
    this.bot = data.bot ?? this.system ?? false;
  }

  /**
   * Returns the default avatar URL
   */
  get defaultAvatar() {
    return Number(this.discriminator) % 5;
  }

  /**
   * Returns the mention of this User
   */
  get mention() {
    return `<@${this.id}>`;
  }

  /**
   * Returns the tag of this User
   */
  get tag() {
    return `${this.username}#${this.discriminator}`;
  }

  /**
   * Checks if a user has a specific user flag
   * @param flag The flag to check for
   * @returns A boolean value if it exists or not
   */
  flag(bit: keyof typeof UserFlags) {
    if (!UserFlags.hasOwnProperty(bit))
      return false;

    return !!((this.flags ?? 0) & UserFlags[bit]);
  }

  /**
   * Creates a DM channel with the bot and this user, possibly
   * caches it if needed.
   *
   * @returns The DM channel created or a [[DiscordRestError]] if anything occured.
   */
  createDM() {
    if (this.dmChannel !== undefined)
      return Promise.resolve(this.dmChannel);

    return this.client.rest.dispatch<APIChannel, RESTPostAPICurrentUserCreateDMChannelJSONBody>({
      endpoint: '/users/@me/channels',
      method: 'GET',
      data: {
        recipient_id: this.id.toString()
      }
    }).then(channel => {
      if (this.client.channels.has(channel.id)) {
        const chan = this.client.channels.get(channel.id)!;
        return chan;
      }

      const chan = Channel.from(this.client, channel);
      this.client.channels.add(chan);

      return chan;
    });
  }

  /**
   * Leaves the DM with this user and bot and removes it from cache.
   *
   * @returns The DM channel the bot had access to, `undefined` if the bot had never create a DM, or a [[DiscordRestError]]
   * if anything occured.
   */
  leaveDM() {
    if (this.dmChannel === undefined)
      return Promise.resolve();

    return this.client.rest.dispatch({
      endpoint: `/channels/${this.dmChannel.id}`,
      method: 'DELETE'
    }).then(() => {
      const channel = this.dmChannel!;
      delete this.dmChannel;

      return channel;
    });
  }

  /**
   * Sends a message to this user. This is a simple function to not repeat:
   * ```js
   * const user = <client>.users.get('280158289667555328');
   * const channel = await user.createDM();
   * channel.send('hi ur cute');
   * ```
   *
   * @param message The message content to send
   * @param options Any additional options, if needed
   * @returns The message created or a [[DiscordRestError]] if
   * any errors occured.
   */
  async send(message: MessageContent, options?: MessageContentOptions) {
    const channel = await this.createDM();
    return channel.send(message, options);
  }
}

DynamicImage.decorate(User, ['avatar']);
export { User };
