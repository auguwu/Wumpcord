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

import type { APIGuildIntegration } from 'discord-api-types/v8';
import type WebSocketClient from '../../gateway/WebSocketClient';
import { User } from '../User';
import Base from '../Base';

interface GuildIntegrationAccount {
  name: string;
  id: string;
}

interface GuildIntegrationProperties extends APIGuildIntegration {
  guildID?: string;
}

export default class GuildIntegration extends Base<GuildIntegrationProperties> {
  /** The expiration grace period (in days) */
  public expireGracePeriod!: number;

  /** Boolean value if emotions from this integration will be synced with Discord */
  public enableEmoticons!: boolean;

  /** How many subscribers the integration has */
  public subscribers!: number;

  /** [Date] on when the last sync occured */
  public lastSyncAt!: Date;

  /** The expiration behaviour ('role' => Remove Role, 'kick' => Member gets kicked from the guild) */
  public behaviour!: 'role' | 'kick';

  /** If the integration was revoked or not */
  public revoked!: boolean;

  /** If the integration is enabled or not */
  public enabled!: boolean;

  /** Account details of the integration */
  public account!: GuildIntegrationAccount;

  /** If Discord is currently syncing this guild with the latest information */
  public syncing!: boolean;

  /** The [WebSocketClient] attached to this [GuildIntegration] */
  private client: WebSocketClient;

  /** The guild ID that this [GuildIntegration] is attached to */
  public guildID?: string;

  /** The role ID for subscribers, if any */
  public roleID!: string;

  /** The user ID who created this [GuildIntegration] instance */
  public userID!: string;

  /** The integration type ('twitch', 'youtube', or 'discord') */
  public type!: 'twitch' | 'youtube' | 'discord';

  /** The name of the integration */
  public name!: string;

  /** The user who created this integration */
  public user?: User;

  /**
   * Creates a new [GuildIntegration] instance
   * @param client The [WebSocketClient] attached to this [GuildIntegration]
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: GuildIntegrationProperties) {
    super(data.id);

    this.guildID = data.guildID;
    this.client = client;

    this.patch(data);
  }

  patch(data: GuildIntegrationProperties) {
    super.patch(data);

    if (data.expire_grace_period !== undefined)
      this.expireGracePeriod = data.expire_grace_period;

    if (data.expire_behavior !== undefined)
      this.behaviour = data.expire_behavior === 0 ? 'role' : 'kick';

    if (data.subscriber_count !== undefined)
      this.subscribers = data.subscriber_count;

    if (data.enable_emoticons !== undefined)
      this.enableEmoticons = data.enable_emoticons;

    if (data.synced_at !== undefined)
      this.lastSyncAt = new Date(data.synced_at);

    if (data.role_id !== undefined)
      this.roleID = data.role_id;

    if (data.revoked !== undefined)
      this.revoked = data.revoked;

    if (data.syncing !== undefined)
      this.syncing = data.syncing;

    if (data.user !== undefined) {
      this.userID = data.user.id;
      this.user = this.client.users.add(new User(this.client, data.user));
    }

    this.account = data.account;
    this.enabled = data.enabled;
    this.type = <any> data.type;
    this.name = data.name;
  }

  toString() {
    return `[wumpcord.GuildIntegration<${this.type}> (${this.name})]`;
  }
}
