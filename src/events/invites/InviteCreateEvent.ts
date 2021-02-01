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

import type { GatewayInviteCreateDispatchData } from 'discord-api-types';
import type { TextableChannel, PartialEntity } from '../../types';
import GuildInvite from '../../models/guild/GuildInvite';
import Event from '../Event';

interface InviteCreateRefs {
  channel: PartialEntity<TextableChannel>;
  invite: GuildInvite;
}

export default class InviteCreateEvent extends Event<GatewayInviteCreateDispatchData, InviteCreateRefs> {
  get channel() {
    return this.$refs.channel;
  }

  get invite() {
    return this.$refs.invite;
  }

  process() {
    this.$refs = {
      channel: this.client.channels.get<TextableChannel>(this.data.channel_id) ?? { id: this.data.channel_id },
      invite: new GuildInvite(this.client, <any> this.data)
    };
  }
}
