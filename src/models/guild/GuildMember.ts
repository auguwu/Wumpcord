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

/* eslint-disable camelcase */

import { Guild, ModifyGuildMemberOptions, GuildBanOptions } from '../Guild';
import type WebSocketClient from '../../gateway/WebSocketClient';
import type { APIGuildMember } from 'discord-api-types';
import { Permissions } from '../../Constants';
import Permission from '../../util/Permissions';
import { GuildRole } from '..';
import { User } from '../User';
import Base from '../Base';

interface IGuildMember extends APIGuildMember {
  guild_id: string;
}

export default class GuildMember extends Base<IGuildMember> {
  public boostedAt!: Date | null;
  public joinedAt!: Date;
  public pending!: boolean;
  public guildID!: string;
  public isMuted!: boolean;
  private _guild!: Guild;
  public isDeaf!: boolean;
  private client: WebSocketClient;
  public roles: GuildRole[] = [];
  public nick!: string | null;
  public user!: User;

  constructor(client: WebSocketClient, data: IGuildMember) {
    super(data.user?.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: IGuildMember) {
    if (data.premium_since !== undefined)
      this.boostedAt = data.premium_since !== null ? new Date(data.premium_since) : null;

    if (data.pending !== undefined)
      this.pending = data.pending;

    if (data.joined_at !== undefined)
      this.joinedAt = new Date(data.joined_at);

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id; // we populate this, not Discord

    if (data.nick !== undefined)
      this.nick = data.nick;

    if (data.mute !== undefined)
      this.isMuted = data.mute;

    if (data.deaf !== undefined)
      this.isDeaf = data.deaf;

    if (data.user !== undefined)
      this.user = this.client.users.add(new User(this.client, data.user));

    if (data.roles !== undefined) {
      for (let i = 0; i < data.roles.length; i++) {
        const roleID = data.roles[i];
        const guild = this.client.guilds.get(this.guildID);

        if (guild !== null) {
          const role = guild.roles.get(roleID);
          if (role !== null) this.roles.push(role);
        }
      }
    }

    this._populateGuild();
  }

  get permission() {
    if (!this._guild) return new Permission('0');
    if (this.id === this._guild.ownerID) return new Permission(String(Permissions.all));

    let permission = this._guild.roles.get(this._guild.id)?.permissions.allow ?? 0;
    this.roles.forEach(role => {
      if (role === null) return;

      const permissions = role.permissions.allow;
      if (permissions & Permissions.administrator) {
        permission = Permissions.all;
        return;
      } else {
        permission |= permissions;
      }
    });

    return new Permission(String(permission));
  }

  private async _populateGuild() {
    if (!this._guild) {
      this._guild = await this.client.guilds.fetch(this.guildID);
    }
  }

  async modify(opts: ModifyGuildMemberOptions, reason?: string) {
    await this._populateGuild();
    return this._guild.modifyMember(this.id, opts, reason);
  }

  async addRole(role: string | GuildRole, reason?: string) {
    await this._populateGuild();

    const id = typeof role === 'string' ? role : role.id;
    return this._guild.addRole(this.id, id, reason);
  }

  async removeRole(role: string | GuildRole, reason?: string) {
    await this._populateGuild();

    const id = typeof role === 'string' ? role : role.id;
    return this._guild.removeRole(this.id, id, reason);
  }

  setNick(nick: string, reason?: string) {
    return this.modify({ nick }, reason);
  }

  mute(reason?: string) {
    return this.modify({ mute: true }, reason);
  }

  unmute(reason?: string) {
    return this.modify({ mute: false }, reason);
  }

  deafen(reason?: string) {
    return this.modify({ deaf: true }, reason);
  }

  undeafen(reason?: string) {
    return this.modify({ deaf: false }, reason);
  }

  async switch(channelID: string, reason?: string) {
    await this._populateGuild();

    let channel = this.client.channels.get(channelID);
    if (!channel) {
      channel = await this.client.channels.fetch(channelID);
    }

    if (channel.type !== 'voice') throw new TypeError(`Channel ${channel.id} was not a voice channel`);
    return this.modify({ channelID: channel.id }, reason);
  }
}
