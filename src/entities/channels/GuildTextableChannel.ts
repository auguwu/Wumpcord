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
import { TextableChannel } from '../inheritable/TextableChannel';
import type { APIChannel } from 'discord-api-types';
import { Permissions } from '../../Constants';
import { Permission } from '../../util/Permissions';
import { Collection } from '@augu/collections';

/**
 * Represents a channel that belongs to a guild with methods like `.send()`
 */
export class GuildTextableChannel extends TextableChannel {
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
    super(client, data);

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
   * Returns a boolean if this channel can cross-post messages.
   */
  get crosspostable() {
    return this.type === 'news';
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
