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

import type WebSocketClient from '../../gateway/WebSocketClient';
import type { APIEmoji } from 'discord-api-types';
import { User } from '../User';
import Base from '../Base';

interface DiscordEmoji extends APIEmoji {
  guild_id?: string; // eslint-disable-line camelcase
}

export default class GuildEmoji extends Base<DiscordEmoji> {
  public requireColons?: boolean;
  public available?: boolean;
  public animated?: boolean;
  public managed?: boolean;
  public guildID?: string;
  private client: WebSocketClient;
  public name!: string | null;
  public user?: User;

  constructor(client: WebSocketClient, data: DiscordEmoji) {
    super(data.id!);

    this.client = client;
    this.patch(data);
  }

  patch(data: DiscordEmoji) {
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
      this.user = this.client.users.add(new User(this.client, data.user));

    if (data.name !== undefined)
      this.name = data.name;
  }

  get mention() {
    const prefix = this.animated ? 'a:' : ':';
    return `<${prefix}:${this.name}:${this.id}>`;
  }

  get guild() {
    if (!this.guildID) return null;

    return this.client.guilds.get(this.guildID);
  }

  toString() {
    return `[wumpcord.GuildEmoji<E: ${this.mention}${this.guild ? `, G: ${this.guild.name}` : ''}>]`;
  }
}
