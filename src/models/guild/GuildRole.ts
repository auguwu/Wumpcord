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
import type { APIRole } from 'discord-api-types';
import Permission from '../../util/Permissions';
import Base from '../Base';

interface DiscordRole extends APIRole {
  guild_id: string; // eslint-disable-line camelcase
}

export default class GuildRole extends Base<DiscordRole> {
  /** If the role is a Nitro Booster role. */
  public isPremiumRole!: boolean;

  /** If the role belongs to a integration, it'll return a Snowflake or `null` if not found */
  public integrationID!: string | null;

  /** Permissions available for this [GuildRole] */
  public permissions!: Permission;

  /** If the role is mentionable or not */
  public mentionable!: boolean;

  /** The sorting position the role is in */
  public position!: number;

  /** If the role is hoisted or not */
  public hoisted!: boolean;

  /** If the role is managed by a integration or not */
  public managed!: boolean;

  /** The guild's ID that this role belongs to */
  public guildID: string;

  /** The [WebSocketClient] attached to this [GuildRole] */
  private client: WebSocketClient;

  /** A bot ID if this [GuildRole] is a bot integration role, it'll return `null` if not. */
  public botID!: string | null;

  /** The color of the role, returns `0` if it's the default */
  public color!: number;

  /** The name of the role */
  public name!: string;

  /**
   * Creates a new [GuildRole] instance
   * @param client The [WebSocketClient] attached to this [GuildRole]
   * @param data The data supplied from Discord
   */
  constructor(client: WebSocketClient, data: DiscordRole) {
    super(data.id);

    this.guildID = data.guild_id;
    this.client = client;

    this.patch(data);
  }

  patch(data: Partial<DiscordRole>) {
    if (data.permissions !== undefined)
      this.permissions = new Permission(data.permissions);

    if (data.mentionable !== undefined)
      this.mentionable = data.mentionable;

    if (data.position !== undefined)
      this.position = data.position;

    if (data.managed !== undefined)
      this.managed = data.managed;

    if (data.hoist !== undefined)
      this.hoisted = data.hoist;

    if (data.color !== undefined)
      this.color = data.color;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.tags !== undefined) {
      this.isPremiumRole = data.tags.premium_subscriber !== undefined;

      if (data.tags.integration_id !== undefined)
        this.integrationID = data.tags.integration_id;

      if (data.tags.bot_id !== undefined)
        this.botID = data.tags.bot_id;
    } else {
      this.isPremiumRole = false;
    }
  }

  /** Returns a hexadecimal version of this [GuildRole]'s color */
  get hex() {
    return this.color.toString(16);
  }

  /** Returns a RGB value-like color from this [GuildRole]'s color */
  get rgb(): [r?: number, g?: number, b?: number] {
    if (this.color === 0) return <any> [];

    let items: any[] = [];
    const result = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(this.hex);
    if (result !== null)
      items.concat([parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]);

    return <any> items;
  }

  /** Returns the guild that this [GuildRole] belongs to */
  get guild() {
    return this.client.guilds.get(this.guildID) || null;
  }

  toString() {
    return `[wumpcord.GuildRole<N: ${this.name}${this.guild ? `, G: ${this.guild.name}` : ''}]`;
  }
}
