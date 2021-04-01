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
import { PermissionOverwrite } from '../PermissionOverwrite';
import TextableChannel from '../inherit/TextableChannel';
import type { APIChannel } from 'discord-api-types/v8';
import { Permissions } from '../../Constants';
import { Collection } from '@augu/collections';
import type { Guild } from '../Guild';
import Permission from '../../util/Permissions';

export default class GuildTextableChannel extends TextableChannel<APIChannel> {
  /** List of permission overwrites for this [GuildChannel] */
  public permissionOverwrites: Collection<string, PermissionOverwrite>;

  /** The parent category's ID, this is `null` if [GuildChannel] is a [CategoryChannel] or doesn't have a parent */
  public parentID!: string | null;

  /** The sorting position the channel is in */
  public position!: number;

  /** The guild ID this [GuildChannel] is attached to */
  public guildID?: string;

  /** The guild that this [GuildChannel] is attached to */
  public guild!: Guild;

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
    super(client, data);

    this.permissionOverwrites = new Collection();
    this.guildID = data.guild_id;
    this.client = client;

    this.patch(data);
  }

  patch(data: APIChannel) {
    super.patch(data);

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
        this.permissionOverwrites?.set(overwrite.id, new PermissionOverwrite(overwrite));
      }
    }
  }

  permissionsOf(memberID: string) {
    if (!this.guild) throw new TypeError('Guild isn\'t cached');

    const member = this.guild.members.get(memberID);
    if (member === null) return new Permission('0');

    let permission = member.permission.allow;
    if (permission & Permissions.administrator) return new Permission(String(Permissions.all));

    let overwrite = this.permissionOverwrites.get(this.guild.id);
    if (overwrite) permission = (permission & ~overwrite.permissions.denied) | overwrite.permissions.allow;

    let deny = 0;
    let allow = 0;
    for (const role of member.roles) {
      if ((overwrite = this.permissionOverwrites.get(role.id)) !== undefined) {
        deny |= overwrite.permissions.denied;
        allow |= overwrite.permissions.allow;
      }
    }

    permission = (permission & ~deny) | allow;
    overwrite = this.permissionOverwrites.get(memberID);

    if (overwrite !== undefined) permission = (permission & ~overwrite.permissions.denied) | overwrite.permissions.allow;
    return new Permission(String(permission));
  }
}
