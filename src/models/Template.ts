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

import type { APITemplate } from 'discord-api-types';
import type WebSocketClient from '../gateway/WebSocketClient';
import { Guild } from './Guild';

export class Template {
  public sourceGuildID!: string;
  public description!: string | null;
  public sourceGuild!: Guild;
  public usageCount!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public creatorID!: string;
  public unsynced!: boolean;
  private client: WebSocketClient;
  public code!: string;
  public name!: string;

  constructor(client: WebSocketClient, data: APITemplate) {
    this.client = client;
    this.patch(data);
  }

  private patch(data: APITemplate) {
    if (data.serialized_source_guild !== undefined)
      this.sourceGuild = this.client.guilds.add(new Guild(this.client, <any> data.serialized_source_guild));

    if (data.source_guild_id !== undefined)
      this.sourceGuildID = data.source_guild_id;

    if (data.updated_at !== undefined)
      this.updatedAt = new Date(data.updated_at);

    if (data.created_at !== undefined)
      this.createdAt = new Date(data.created_at);

    if (data.description !== undefined)
      this.description = data.description;

    if (data.creator_id !== undefined)
      this.creatorID = data.creator_id;

    if (data.usage_count !== undefined)
      this.usageCount = data.usage_count;

    if (data.is_dirty !== undefined)
      this.unsynced = Boolean(data.is_dirty);

    if (data.code !== undefined)
      this.code = data.code;

    if (data.name !== undefined)
      this.name = data.name;
  }

  fetch() {
    return this.client.rest.dispatch<APITemplate>({
      endpoint: `/guilds/templates/${this.code}`,
      method: 'GET'
    }).then(data => {
      this.patch(data);
      return this;
    });
  }

  get url() {
    return `https://discord.new/${this.code}`;
  }

  toString() {
    return `[wumpcord.Template<${this.url}>]`;
  }
}
