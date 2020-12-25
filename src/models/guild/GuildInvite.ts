/**
 * Copyright (c) 2020 August, Ice
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

import type { APIExtendedInvite, APIInvite } from 'discord-api-types';
import type { AnyGuildChannel } from '../../types';
import type WebSocketClient from '../../gateway/WebSocketClient';
import { User } from '../User';

export default class GuildInvite {
  /** The approximate presence count available */
  public approximatePresenceCount!: number;

  /** The approximate member count available */
  public approximateMemberCount!: number | null;

  /** The target user type */
  public targetUserType!: 'stream' | 'unknown';

  /** If the invite is temporary or not */
  public temporary!: boolean;

  /** The target user who this invite was meant to be for */
  public targetUser!: User;

  /** [Date] value on when this [GuildInvite] was created at */
  public createdAt!: Date;

  /** The channel's ID that the invite was created in */
  public channelID!: string;

  /** Maxmium amount of use cases, returns `null` if there is no limit */
  public maxUses!: number | null;

  /** Millisecond count on when the invite is expired, returns `null` if there is no max age */
  public maxAge!: number | null;

  /** The user who created the invite */
  public inviter!: User;

  /** The guild's ID that the invite was created for */
  public guildID!: string;

  /** The [WebSocketClient] attached to this [GuildInvite] */
  private client: WebSocketClient;

  /** The code of the invite */
  public code!: string;

  /** Number of uses this invite has been used on */
  public uses!: number;

  /**
   * Creates a new [GuildInvite] instance
   * @param client The [WebSocketClient] attached
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: APIExtendedInvite) {
    this.client = client;
    this.patch(data);
  }

  private patch(data: APIExtendedInvite) {
    if (data.approximate_presence_count !== undefined)
      this.approximatePresenceCount = data.approximate_presence_count;

    if (data.approximate_member_count !== undefined)
      this.approximateMemberCount = data.approximate_member_count;

    if (data.target_user_type !== undefined)
      this.targetUserType = data.target_user_type === 1 ? 'stream' : 'unknown';

    if (data.target_user !== undefined)
      this.targetUser = this.client.users.add(new User(this.client, data.target_user));

    if (data.created_at !== undefined)
      this.createdAt = new Date(data.created_at);

    if (data.temporary !== undefined)
      this.temporary = data.temporary;

    if (data.channel !== undefined)
      this.channelID = data.channel.id;

    if (data.inviter !== undefined)
      this.inviter = this.client.users.add(new User(this.client, data.inviter));

    if (data.guild !== undefined)
      this.guildID = data.guild.id;

    if (data.max_uses !== undefined)
      this.maxUses = data.max_uses === 0 ? null : data.max_uses;

    if (data.max_age !== undefined)
      this.maxAge = data.max_age === 0 ? null : data.max_age * 1000;

    if (data.uses !== undefined)
      this.uses = data.uses;
  }

  /**
   * Returns the guild channel that this [GuildInvite] was created in
   */
  get channel() {
    return this.client.channels.get(this.channelID) as AnyGuildChannel | null;
  }

  /**
   * Returns the guild that this [GuildInvite] was created in
   */
  get guild() {
    return this.client.guilds.get(this.guildID);
  }

  /**
   * Fetches new metadata for this [GuildInvite] and populates it
   * @param withCounts If we should add the `?with_counts` query parameter
   */
  fetch(withCounts?: boolean) {
    const endpoint = `/invites/${this.code}${withCounts ? '?with_counts=true' : ''}`;

    return this.client.rest.dispatch<APIInvite>({
      endpoint,
      method: 'GET'
    }).then(data => {
      this.patch(<any> data);
      return this;
    });
  }

  /**
   * Deletes the invite and returns this [GuildInvite]
   */
  delete() {
    return this.client.rest.dispatch<any>({
      endpoint: `/invites/${this.code}`,
      method: 'DELETE'
    }).then(() => this);
  }

  toString() {
    return `[wumpcord.GuildInvite "https://discord.gg/${this.code}"]`;
  }
}
