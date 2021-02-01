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

import type { APIApplication } from 'discord-api-types';
import type WebSocketClient from '../gateway/WebSocketClient';
import { CDNUrl } from '../Constants';
import { User } from './User';
import Team from './teams/Team';
import Base from './Base';

const TeamRegex = /team\d+/g;

export class Application extends Base<APIApplication> {
  public requiresCodeGrant!: boolean;
  public primarySkuID!: string;
  public description!: string | null;
  public rpcOrigins!: string[];
  public coverImage!: string | null;
  public isPublic!: boolean;
  public guildID!: string;
  public summary!: string | null;
  private client: WebSocketClient;
  public owner!: User | null;
  public flags!: number;
  public team!: Team | null;
  public icon!: string | null;
  public name!: string;
  public slug!: string;

  constructor(client: WebSocketClient, data: APIApplication) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: APIApplication) {
    if (data.bot_require_code_grant !== undefined)
      this.requiresCodeGrant = Boolean(data.bot_require_code_grant);

    if (data.primary_sku_id !== undefined)
      this.primarySkuID = data.primary_sku_id;

    if (data.description !== undefined)
      this.description = data.description;

    if (data.rpc_origins !== undefined)
      this.rpcOrigins = data.rpc_origins;

    if (data.cover_image !== undefined)
      this.coverImage = data.cover_image;

    if (data.bot_public !== undefined)
      this.isPublic = Boolean(data.bot_public);

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.summary !== undefined)
      this.summary = data.summary;

    if (data.owner !== undefined)
      this.owner = TeamRegex.test(data.owner.username) ? null : this.client.users.add(new User(this.client, data.owner));

    if (data.flags !== undefined)
      this.flags = data.flags;

    if (data.team !== undefined)
      this.team = data.team !== null ? new Team(this.client, data.team) : null;

    if (data.icon !== undefined)
      this.icon = data.icon;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.slug !== undefined)
      this.slug = data.slug;
  }

  get iconUrl() {
    return this.icon === null ? null : `${CDNUrl}/app-icons/${this.id}/${this.icon}.png?size=1024`;
  }

  get coverUrl() {
    return this.coverImage === null ? null : `${CDNUrl}/app-icons/${this.id}/${this.coverImage}?size=1024`;
  }
}
