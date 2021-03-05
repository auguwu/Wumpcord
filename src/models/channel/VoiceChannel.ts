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
import type { APIChannel } from 'discord-api-types/v8';
import { Permissions } from '../../Constants';
import GuildChannel from './GuildChannel';
import Permission from '../../util/Permissions';

export class VoiceChannel extends GuildChannel {
  /** The limit that users can join this [VoiceChannel] */
  public userLimit!: number;

  /** The bitrate of the voice channel */
  public bitrate!: number;

  /**
   * Creates a new [VoiceChannel] instance
   * @param client The [WebSocket] client attached to this [VoiceChannel]
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: APIChannel) {
    super(client, data);

    this.patch(data);
  }

  patch(data: APIChannel) {
    super.patch(data);

    if (data.bitrate !== undefined)
      this.bitrate = data.bitrate;

    if (data.user_limit !== undefined)
      this.userLimit = data.user_limit;
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

  join() {
    return this.client.voice.joinChannel(this);
  }

  leave() {
    return this.client.voice.leaveChannel(this);
  }
}
