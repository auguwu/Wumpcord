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

import type { GatewayGuildCreateDispatchData } from 'discord-api-types';
import { Guild } from '../../models/Guild';
import Event from '../Event';

interface GuildCreateRefs {
  guild: Guild;
}

export default class GuildCreateEvent extends Event<GatewayGuildCreateDispatchData, GuildCreateRefs> {
  get guild() {
    return this.$refs.guild;
  }

  process() {
    if (this.client.guilds.has(this.data.id)) {
      const guild = this.client.guilds.get(this.data.id);
      if (guild !== null) {
        if (!guild.unavailable && !this.data.unavailable) {
          guild.patch({ ...this.data }); // eslint-disable-line camelcase
          this.client.guilds.cache.set(this.data.id, guild);
          this.$refs = { guild };

          return true;
        }
      }
    }

    const guild = new Guild(this.client, { shard_id: this.shard.id, ...this.data }); // eslint-disable-line camelcase

    this.client.guilds.add(guild);
    this.$refs = { guild };
    return false;
  }
}
