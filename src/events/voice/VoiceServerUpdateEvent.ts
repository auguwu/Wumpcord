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

import type { GatewayVoiceServerUpdateDispatchData } from 'discord-api-types';
import type { PartialEntity } from '../../types';
import type { Guild } from '../../models';
import Event from '../Event';

interface VoiceServerUpdateRefs {
  endpoint: string;
  guild: PartialEntity<Guild>;
  token: string;
}

export default class VoiceServerUpdateEvent extends Event<GatewayVoiceServerUpdateDispatchData, VoiceServerUpdateRefs> {
  get token() {
    return this.$refs.token;
  }

  get guild() {
    return this.$refs.guild;
  }

  get endpoint() {
    return this.$refs.endpoint;
  }

  process() {
    this.$refs = {
      endpoint: this.data.endpoint,
      guild: this.client.guilds.get(this.data.guild_id) || { id: this.data.guild_id },
      token: this.data.token
    };
  }
}
