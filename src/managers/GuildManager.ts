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

import type WebSocketClient from '../gateway/WebSocketClient';
import type { APIGuild } from 'discord-api-types';
import UnavailableGuild from '../models/guild/UnavailableGuild';
import BaseManager from './BaseManager';
import { Guild } from '../models';

export default class GuildManager extends BaseManager<Guild> {
  constructor(client: WebSocketClient) {
    super(client, Guild);
  }

  fetch(id: string) {
    return this.client.rest.dispatch<APIGuild>({
      endpoint: `/guilds/${id}`,
      method: 'GET'
    }).then(data => {
      const shard = this.client.shards.filter(shard => shard.guilds.has(data.id));
      let shardID: number = 0;

      if (shard.length > 0) shardID = shard[0].id;
      if (data.unavailable !== undefined && data.unavailable === true) return this.add(new UnavailableGuild({
        shard_id: shardID, // eslint-disable-line camelcase
        unavailable: true,
        id: data.id
      }));

      return this.add(new Guild(this.client, { shard_id: shardID, ...data })); // eslint-disable-line camelcase
    });
  }
}
