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

import type { MessageContent, MessageContentOptions } from '../types';
import type { APIUser, APIChannel } from 'discord-api-types';
import type { WebSocketClient } from '../gateway/WebSocketClient';
import { CDNUrl, UserFlags } from '../Constants';
import { DynamicImage } from './inheritable/DynamicImage';
import { BaseEntity } from './BaseEntity';
import { Snowflake } from '../util/Snowflake';

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
}

DynamicImage.decorate(User, ['avatar']);
export { User };
