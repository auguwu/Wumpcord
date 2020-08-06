/**
 * Copyright (c) 2020 August
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

import type { GuildPacket } from '../util/models';
import type { Client } from '../Client';
import { GuildChannel } from './channel';
import { Collection } from '@augu/immutable';
import type { Shard } from '../sharding';
import { VoiceState } from './voice';
import { Member } from './Member';
import { Role } from './Role';
import { Base } from './Base';

export class Guild extends Base {
  public approximatePresenceCount: number;
  public approximateMemberCount: number;
  public widgetEnabled: boolean;
  public unavaliable: boolean;
  public voiceStates: Collection<VoiceState> | number;
  public channels: Collection<GuildChannel> | number;
  public members: Collection<Member> | number;
  public shard: Shard | null;
  public roles: Collection<Role> | number;

  constructor(client: Client, data: GuildPacket) {
    super(client, data.id);

    const shardID = client.getShardIdByGuild(data.id);

    this.approximatePresenceCount = data.hasOwnProperty('approximate_presence_count') ? data.approximate_presence_count! : 0;
    this.approximateMemberCount = data.hasOwnProperty('approximate_member_count') ? data.approximate_member_count! : 0;
    this.widgetEnabled = data.hasOwnProperty('widget_enabled') ? data.widget_enabled : false;
    this.unavaliable = Boolean(data.unavaliable);
    this.voiceStates = client.canCache('voice') ? new Collection() : 0;
    this.channels = client.canCache('channel') ? new Collection() : 0;
    this.members = client.canCache('member') ? new Collection() : 0;
    this.shard = client.shards.has(shardID) ? client.shards.get(shardID)! : null;
    this.roles = client.canCache('roles') ? new Collection() : 0;

    if (data.roles.length) {
      if (client.canCache('roles')) {
        const roles = this.roles as Collection<Role>;
        for (const role of data.roles) roles.set(role.id, new Role(client, role));
      } else {
        this.roles = data.roles.length;
      }
    }

    if (data.channels.length) {
      if (client.canCache('channel')) {
        const channels = this.channels as Collection<GuildChannel>;
        for (const channel of data.channels) {
          const chan = new GuildChannel(client, channel);
          chan.guild = this;

          channels.set(channel.id, chan);
        }
      } else {
        this.channels = data.channels.length;
      }
    }

    if (data.members.length) {
      if (client.canCache('member')) {
        for (const member of data.members) {
          member.id = member.user.id;
          (this.members as Collection<Member>).set(member.id, new Member(client, member));
        }
      } else {
        this.members = data.members.length;
      }
    }

    // TODO: implement voice states and presences here lol
  }
}