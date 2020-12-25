/**
 * Copyright (c) 2020 August, Ice
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

import type { MessageContent, MessageContentOptions } from '../types';
import type { APIUser, APIChannel } from 'discord-api-types';
import { CDNUrl, UserFlags } from '../Constants';
import type WebSocketClient from '../gateway/WebSocketClient';
import { DMChannel } from './channel/DMChannel';
import Base from './Base';

type UserFlag =
  | 'None'
  | 'Staff'
  | 'Partner'
  | 'HypesquadEvents'
  | 'BugHunterLevel1'
  | 'Bravery'
  | 'Brillance'
  | 'Balance' // the best house dont @ me <3
  | 'EarlySupporter'
  | 'Teamuser'
  | 'System'
  | 'BugHunterLevel2'
  | 'VerifiedBot'
  | 'VerifiedBotDev';

export class User extends Base<APIUser> {
  /** The user's discriminator */
  public discriminator!: string;

  /** The DM channel created when using [User.createDM], [User.leaveDM], or [User.send] */
  private _dmChannel!: DMChannel | undefined;

  /** The user's username */
  public username!: string;

  /** The [WebSocketClient] attached */
  private client: WebSocketClient;

  /** The user's avatar UUID */
  public avatar!: string | null;

  /** The user account is a system account or not */
  public system!: boolean;

  /** The user's public flags */
  public flags!: number;

  /** If the user is a bot account or not */
  public bot!: boolean;

  /**
   * Creates a new [User] instance
   * @param client The [WebSocketClient] attached
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: APIUser) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: APIUser) {
    this.discriminator = data.discriminator;
    this.username = data.username;
    this.avatar = data.avatar;
    this.system = Boolean(data.system);
    this.flags = data.public_flags as any;
    this.bot = Boolean(data.bot);
  }

  /** Returns the default avatar's UUID */
  get defaultAvatar() {
    const discrim = Number(this.discriminator);
    return discrim % 5;
  }

  /** Returns the URL for the default avatar */
  get defaultAvatarUrl() {
    return `${CDNUrl}/avatars/${this.defaultAvatar}.png`;
  }

  /** Returns the avatar url in 512x512 and using .png (or .gif), use [User.dynamicAvatarUrl] to customize the size and extension */
  get avatarUrl() {
    const format = this.avatar!.startsWith('a_') ? 'gif' : 'png';
    return this.avatar === null ? this.defaultAvatarUrl : `${CDNUrl}/avatars/${this.id}/${this.avatar}?size=512&format=${format}`;
  }

  /** Returns the mention string for this user */
  get mention() {
    return `<@!${this.id}>`;
  }

  /** Returns the user's full tag */
  get tag() {
    return `${this.username}#${this.discriminator}`;
  }

  /**
   * Check if the user has a specified flag
   * @param name The flag to check
   */
  flag(name: UserFlag) {
    const bit: number = UserFlags[name];
    return !!(this.flags & bit);
  }

  /**
   * Creates a DM channel with this user and the bot
   * @returns The DM channel or a REST error if we can't create one
   */
  createDM() {
    if (this._dmChannel) return Promise.resolve(this._dmChannel);

    return this.client.rest.dispatch<APIChannel>({
      endpoint: '/users/@me/channels',
      method: 'POST',
      data: {
        recipient_id: this.id // eslint-disable-line camelcase
      }
    }).then(data => {
      const channel = new DMChannel(this.client, data);
      this.client.channels.add(channel);

      this._dmChannel = channel;
      return this._dmChannel;
    });
  }

  /**
   * Leaves the DM channel, if there is no DM channel populated,
   * it'll return `null`, else it'll return the DM channel upon request
   * or a REST error if anything occurs
   */
  leaveDM(): Promise<DMChannel | null> {
    if (!this._dmChannel) return Promise.resolve(null);

    return this.client.rest.dispatch({
      endpoint: `/channels/${this._dmChannel.id}`,
      method: 'DELETE'
    }).then(() => {
      const channel = this._dmChannel;
      this._dmChannel = undefined;

      return channel!;
    });
  }

  /**
   * Sends a message to the user
   * @param content The content to send
   * @param options Any additional options, if needed
   */
  async send(content: MessageContent, options?: MessageContentOptions) {
    if (!this._dmChannel) await this.createDM();
    return this._dmChannel!.send(content, options);
  }

  toString() {
    return `[wumpcord.User<U: ${this.tag}>]`;
  }
}
