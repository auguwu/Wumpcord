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

import type { APIGuild } from 'discord-api-types';
import { WebSocketClient } from '../Client';
import { BaseStore } from './BaseStore';
import { Guild } from '../entities/Guild';
import { deepStrictEqual } from 'assert';
import { UnavailableGuild } from '../entities/UnavailableGuild';
import { NoopEntityCache } from '../cache';

export class GuildStore extends BaseStore<Guild> {
  constructor(client: WebSocketClient) {
    super(client, 'guilds');
  }

  /**
   * Method to fetch a guild from Discord's REST API and possibly caches it.
   * @param id The guild's ID
   */
  fetch(id: string): Promise<Guild> {
    return this.client.rest.dispatch<never, APIGuild>({
      endpoint: `/guilds/${id}`,
      method: 'GET'
    }).then(d => {
      const shard = this.client.shards.filter(s => s.guilds.has(d.id));
      let shardID = 0;

      if (shard.length > 0) shardID = shard[0].id;
      if (d.unavailable !== undefined && d.unavailable === true) return this.put(new UnavailableGuild({
        shard_id: shardID, // eslint-disable-line camelcase
        unavailable: true,
        id: d.id
      }) as any);

      const guild = new Guild(this.client, { shard_id: shardID, nsfw_level: (d as any).nsfw_level, ...d }); // eslint-disable-line
      return this.put(guild);
    });
  }
}
