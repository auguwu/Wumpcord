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

import type { Guild, ModifyGuildMemberOptions, Role } from '..';
import type { APIGuildMember as _APIGuildMember } from 'discord-api-types';
import type { WebSocketClient } from '../Client';
import { Permissions } from '../Constants';
import { Permission } from '../util/Permissions';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

/**
 * https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export interface APIGuildMember extends _APIGuildMember {
  /**
   * The guild's ID if populated (Wumpcord does this, not Discord)
   */
  guild_id?: string;
}

/**
 * https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class Member extends BaseEntity<APIGuildMember> {
  /**
   * If the member has boosted the guild, this returns a JavaScript date
   * of when they boosted, or `null` if they didn't.
   */
  public boostedAt!: Date | null;

  /**
   * The member's joined at timestamp
   */
  public joinedAt!: Date;

  /**
   * If the member is pending verification to join this guild, i.e hasn't
   * passed the guild's Membership Screening requirements.
   */
  public pending!: boolean;

  /**
   * The guild ID this member belongs to, returns `undefined`
   * if Wumpcord didn't populate the guild ID.
   */
  public guildID?: string;

  /**
   * Whenther the member is deafened in voice channels
   */
  public deafend!: boolean;

  /**
   * The populated guild
   * @internal
   */
  private _guild?: Guild;

  /**
   * The client attached to this member.
   * @internal
   */
  private client: WebSocketClient;

  /**
   * Whenther the member is muted in voice channels
   */
  public muted!: boolean;

  /**
   * The role IDs this member has
   */
  public roles: string[] = [];

  /**
   * The user's nickname if set, otherwise `null`.
   */
  public nick!: string | null;

  /**
   * The user object for this member.
   */
  public user!: User;

  constructor(client: WebSocketClient, data: APIGuildMember) {
    super(data.user?.id);

    this.client = client;
    this.patch(data);
  }

  /** @internal */
  patch(data: Partial<APIGuildMember>) {
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
      this.muted = data.mute;

    if (data.deaf !== undefined)
      this.deafend = data.deaf;

    if (data.user !== undefined)
      this.user = this.client.users.put(new User(this.client, data.user));

    if (data.roles !== undefined)
      this.roles = data.roles;

    this._guild = this.client.guilds.get(data.guild_id!);
  }

  /**
   * Returns a [Permission] object of what the member
   * has in the guild as of their roles.
   */
  get permission() {
    if (!this._guild)
      return new Permission('0');

    if (this.id === this._guild.ownerID)
      return new Permission(String(Permissions.all));

    let permission = BigInt(this._guild.roles.get(this._guild.id)?.permissions.allow ?? 0);
    this.roles.forEach(r => {
      const role = this._guild?.roles.get(r);
      if (!role) return;

      const permissions = BigInt(role.permissions.allow);
      if (permissions & Permissions.administrator) {
        permission = Permissions.all;
        return;
      } else {
        permission |= permissions;
      }
    });

    return new Permission(String(permission));
  }

  /** @internal */
  private async _populateGuild() {
    if (!this.guildID) throw new TypeError('Missing `guildID` property, was this created on accident?');
    if (!this._guild) {
      this._guild = await this.client.guilds.fetch(this.guildID);
    }
  }

  /**
   * Modify attributes of this guild member.
   * @param options The options to use
   * @param reason The reason to put in audit logs
   */
  async modify(opts: ModifyGuildMemberOptions = {}, reason?: string) { // eslint-disable-line default-param-last
    await this._populateGuild();
    return this._guild!.modifyMember(this.id, opts, reason);
  }

  /**
   * Adds a role to this member
   * @param roleID The role's ID or a [Role] to put in
   * @param reason The reason to put in audit logs
   */
  async addRole(role: string | Role, reason?: string) {
    await this._populateGuild();

    const id = typeof role === 'string' ? role : role.id;
    return this._guild!.addRole(this.id, id, reason);
  }

  /**
   * Removes a role to this member
   * @param roleID The role's ID or a [Role] to put in
   * @param reason The reason to put in audit logs
   */
  async removeRole(role: string | Role, reason?: string) {
    await this._populateGuild();

    const id = typeof role === 'string' ? role : role.id;
    return this._guild!.removeRole(this.id, id, reason);
  }

  /**
   * Edits the nickname of this member.
   * @param nick The nickname to set or `null` to reset it
   * @param reason The reason to put in audit logs
   */
  setNick(nick: string | null, reason?: string) {
    return this.modify({ nick }, reason);
  }

  /**
   * Mutes this member in the guild
   * @param reason The reason to put in audit logs
   */
  mute(reason?: string) {
    return this.modify({ mute: true }, reason);
  }

  /**
   * Unmutes this member in the guild
   * @param reason The reason to put in audit logs
   */
  unmute(reason?: string) {
    return this.modify({ mute: false }, reason);
  }

  /**
   * Deafens this member in the guild
   * @param reason The reason to put in audit logs
   */
  deafen(reason?: string) {
    return this.modify({ deaf: true }, reason);
  }

  /**
   * Undeafens this member in the guild
   * @param reason The reason to put in audit logs
   */
  undeafen(reason?: string) {
    return this.modify({ deaf: false }, reason);
  }

  /**
   * Switches the member's voice channel.
   * @param channelID The channel to put or kick them in.
   * @param reason The reason to put in audit logs
   */
  async switch(channelID: string, reason?: string) {
    await this._populateGuild();

    let channel = this.client.channels.get<any>(channelID);
    if (!channel) {
      channel = await this.client.channels.fetch(channelID);
    }

    if (channel.type !== 'voice') throw new TypeError(`Channel ${channel.id} was not a voice channel`);
    return this.modify({ channel_id: channel.id }, reason);
  }
}
