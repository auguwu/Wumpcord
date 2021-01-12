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

import type { GatewayChannelUpdateDispatchData } from 'discord-api-types';
import type { AnyChannel, PartialEntity } from '../../types';
import { Channel, Guild } from '../../models';
import Event from '../Event';

interface ChannelUpdateRefs {
  old: PartialEntity<AnyChannel> | null;
  new: AnyChannel;
}

export default class ChannelUpdateEvent extends Event<GatewayChannelUpdateDispatchData, ChannelUpdateRefs> {
  get old() {
    return this.$refs.old;
  }

  get channel() {
    return this.$refs.new;
  }

  process() {
    const guild = this.data.guild_id !== undefined ? this.client.guilds.get(this.data.guild_id) ?? { id: this.data.guild_id } : undefined;
    if (!guild || !guild.hasOwnProperty('channels')) {
      this.$refs = {
        old: null,
        new: Channel.from(this.client, this.data)
      };

      return;
    }

    const updated = Channel.from(this.client, this.data);
    const old = (guild as Guild).channels.get<AnyChannel>(this.data.id);
    if (old === null) {
      this.$refs = {
        old: null,
        new: updated
      };

      return;
    }

    (guild as Guild).channels.remove(old);
    (guild as Guild).channels.add(updated);
    this.$refs = {
      old,
      new: updated
    };
  }
}
