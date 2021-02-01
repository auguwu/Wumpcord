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

import { GatewayPresenceUpdate, PresenceUpdateStatus } from 'discord-api-types';
import type WebSocketClient from '../../gateway/WebSocketClient';
import { User } from '../User';
import Activity from './Activity';
import Base from '../Base';
import Util from '../../util';

type ClientStatus = {
  [P in 'desktop' | 'mobile' | 'web']: PresenceUpdateStatus;
};

export default class Presence extends Base<GatewayPresenceUpdate> {
  /** The client status available for this [Presence] */
  public clientStatus!: ClientStatus;

  /** List of activities this user beholds */
  public activities!: Activity[];

  /** The current status (online, idle, dnd, offline) */
  public status!: 'offline' | 'online' | 'idle' | 'dnd';

  /** The [WebSocketClient] attached to this [Presence] */
  private client: WebSocketClient;

  /** The guild that the presence was emitted in */
  public guildID!: string;

  /** The user that holds this [Presence] */
  public user!: User;

  /**
   * Creates a new [Presence] instance
   * @param client The [WebSocketClient] attached
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: GatewayPresenceUpdate) {
    super(data.user.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: GatewayPresenceUpdate) {
    if (data.client_status !== undefined)
      this.clientStatus = {
        desktop: Util.get(data.client_status, 'desktop', PresenceUpdateStatus.Offline)!,
        mobile: Util.get(data.client_status, 'mobile', PresenceUpdateStatus.Offline)!,
        web: Util.get(data.client_status, 'web', PresenceUpdateStatus.Offline)!
      };

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.status !== undefined)
      this.status = data.status as any;

    if (data.user !== undefined)
      this.user = this.client.users.add(new User(this.client, <any> data.user));

    if (data.activities !== undefined) {
      for (let i = 0; i < data.activities.length; i++) {
        const activity = data.activities[i];
        this.activities.push(new Activity(activity));
      }
    }
  }

  /** Returns the guild that this [Presence] was emitted in, if any. */
  get guild() {
    return this.client.guilds.get(this.guildID);
  }

  toString() {
    const current = this.activities.length ? this.activities[0] : null;

    // this looks nasty help
    const suffix = this.guild && current
      ? `, G: ${this.guild.name}, C: ${current.name}`
      : this.guild !== null && current === null
        ? `, G: ${this.guild.name}`
        : this.guild === null && current !== null
          ? `, C: ${current.name}`
          : '';

    return `[wumpcord.GuildPresence<U: ${this.user.tag}${suffix}]`;
  }
}
