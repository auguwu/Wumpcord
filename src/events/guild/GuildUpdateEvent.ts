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

import type { GatewayGuildUpdateDispatchData } from 'discord-api-types';
import { Guild } from '../../models/Guild';
import Event from '../Event';

interface GuildUpdateRefs {
  updated: Guild;
  old: Guild | null;
}

export default class GuildUpdateEvent extends Event<GatewayGuildUpdateDispatchData, GuildUpdateRefs> {
  get old() {
    return this.$refs.old;
  }

  get guild() {
    return this.$refs.updated;
  }

  process() {
    const guild = this.client.guilds.get(this.data.id);
    if (guild === null) {
      const updated = new Guild(this.client, { shard_id: this.shard.id, ...this.data }); // eslint-disable-line camelcase
      this.$refs = {
        updated,
        old: null
      };

      this.client.guilds.add(updated);
      return;
    }

    const old = guild; // keep a reference
    guild.patch({ shard_id: this.shard.id, ...this.data }); // eslint-disable-line camelcase
    this.client.guilds.add(guild);

    this.$refs = {
      updated: guild,
      old
    };
  }
}
