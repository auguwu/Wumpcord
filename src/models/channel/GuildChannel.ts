/**
 * Copyright (c) 2020-2021 August, Ice
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
import { PermissionOverwrite } from '../PermissionOverwrite';
import type { APIChannel } from 'discord-api-types/v8';
import { Collection } from '@augu/collections';
import type { Guild } from '../Guild';
import { Channel } from '../Channel';

export default class GuildChannel extends Channel {
  /** List of permission overwrites for this [GuildChannel] */
  public permissionOverwrites!: Collection<string, PermissionOverwrite>;

  /** The parent category's ID, this is `null` if [GuildChannel] is a [CategoryChannel] or doesn't have a parent */
  public parentID!: string | null;

  /** The sorting position the channel is in */
  public position!: number;

  /** The guild ID this [GuildChannel] is attached to */
  public guildID!: string;

  /** The guild that this [GuildChannel] is attached to */
  public guild!: Guild;
  private client: WebSocketClient;

  /** The name of this [GuildChannel] instance */
  public name!: string;

  /** If the channel is marked NSFW or not */
  public nsfw!: boolean;

  /**
   * Creates a new [GuildChannel] instance
   * @param client The WebSocket client attached
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: APIChannel) {
    super(data);

    this.guildID = data.guild_id!;
    this.client = client;

    this.patch(data);
  }

  patch(data: APIChannel) {
    super.patch(data);

    this.permissionOverwrites = new Collection();

    if (data.position !== undefined)
      this.position = data.position;

    if (data.parent_id !== undefined)
      this.parentID = data.parent_id;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.nsfw !== undefined)
      this.nsfw = data.nsfw ?? false;

    if (data.permission_overwrites !== undefined) {
      for (let i = 0; i < data.permission_overwrites.length; i++) {
        const overwrite = data.permission_overwrites[i];
        this.permissionOverwrites.set(overwrite.id, new PermissionOverwrite(overwrite));
      }
    }
  }
}
