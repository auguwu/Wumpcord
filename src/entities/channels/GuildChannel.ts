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

import type { WebSocketClient } from '../../Client';
import { PermissionOverwrite } from '../PermissionOverwrite';
import type { APIChannel } from 'discord-api-types';
import { Permissions } from '../../Constants';
import { Permission } from '../../util/Permissions';
import { Collection } from '@augu/collections';
import { Channel } from '../Channel';

/**
 * Represents a channel that belongs to a guild.
 */
export class GuildChannel extends Channel {
  /**
   * List of permission overwrites available for this channel.
   */
  public permissionOverwrites: Collection<string, PermissionOverwrite> = new Collection();

  /**
   * The channel's parent ID if present in a category channel.
   */
  public parentID!: string | null;

  /**
   * The sorting position for this [[GuildChannel]].
   */
  public position!: number;

  /**
   * The client for this guild channel.
   */
  private client: WebSocketClient;

  /**
   * The guild ID for this [[GuildChannel]], if present.
   */
  public guildID?: string;

  /**
   * The name of the channel.
   */
  public name!: string;

  /**
   * If the [[GuildChannel]] is a NSFW channel or not.
   */
  public nsfw!: boolean;

  constructor(client: WebSocketClient, data: APIChannel) {
    super(data);

    this.client = client;
    this.guildID = data.guild_id;
    this.patch(data);
  }

  patch(data: Partial<APIChannel>) {
    super.patch(data as APIChannel);

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
        this.permissionOverwrites.set(data.permission_overwrites[i].id, new PermissionOverwrite(data.permission_overwrites[i]));
      }
    }
  }

  /**
   * Returns the guild for this [[GuildChannel]]. This requires
   * the `guilds` cache entity to not be a [[NoopEntityCache]].
   */
  get guild() {
    return null;
  }

  /**
   * Checks the permission of a member in this [[GuildChannel]].
   * @param memberID The member's ID
   * @returns a [[Permission]] instance of that member's overwrite.
   */
  permissionsOf(memberID: string) {
    // todo: this
  }
}

/*
export default class GuildChannel extends Channel {
  permissionsOf(memberID: string) {
    if (!this.guild) throw new TypeError('Guild isn\'t cached');

    const member = this.guild.members.get(memberID);
    if (member === null) return new Permission('0');

    let permission = BigInt(member.permission.allow);
    if (permission & Permissions.administrator) return new Permission(String(Permissions.all));

    let overwrite = this.permissionOverwrites.get(this.guild.id);
    if (overwrite) permission = (permission & BigInt(~overwrite.permissions.denied)) | BigInt(overwrite.permissions.allow);

    let deny = 0n;
    let allow = 0n;
    for (const role of member.roles) {
      if ((overwrite = this.permissionOverwrites.get(role.id)) !== undefined) {
        deny |= overwrite.permissions.denied;
        allow |= overwrite.permissions.allow;
      }
    }

    permission = (permission & BigInt(~deny)) | BigInt(allow);
    overwrite = this.permissionOverwrites.get(memberID);

    if (overwrite !== undefined) permission = (permission & BigInt(~overwrite.permissions.denied)) | BigInt(overwrite.permissions.allow);
    return new Permission(String(permission));
  }
}
*/
