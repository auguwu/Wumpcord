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

import type { GatewayVoiceStateUpdateDispatchData } from 'discord-api-types';
import type { AnyChannel, PartialEntity } from '../../types';
import { Guild, VoiceState } from '../../models';
import Event from '../Event';

interface VoiceStateUpdateRefs {
  channel: PartialEntity<AnyChannel> | null;
  guild: PartialEntity<Guild> | null;
  state: VoiceState;
}

export default class VoiceStateUpdateEvent extends Event<GatewayVoiceStateUpdateDispatchData, VoiceStateUpdateRefs> {
  get channel() {
    return this.$refs.channel;
  }

  get guild() {
    return this.$refs.guild;
  }

  get voiceState() {
    return this.$refs.state;
  }

  process() {
    console.trace('ea sports');
    const channel = this.data.channel_id !== null
      ? this.client.channels.get(this.data.channel_id) || { id: this.data.channel_id }
      : null;

    const guild = this.data.guild_id !== undefined
      ? this.client.guilds.get(this.data.guild_id) || { id: this.data.guild_id }
      : null;

    const voiceState = new VoiceState(this.data);
    this.$refs = {
      channel,
      guild,
      state: voiceState
    };

    if (channel !== null && guild !== null && (channel as AnyChannel).type === 'voice') {
      this.shard.debug('Checking if there is an active voice connection...');

      const connection = this.client.voiceConnections.get(guild.id);
      if (connection !== undefined) connection.onVoiceStateUpdate(this.data);
    }
  }
}
