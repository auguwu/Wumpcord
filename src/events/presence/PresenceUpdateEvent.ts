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

import type { GatewayPresenceUpdateDispatchData } from 'discord-api-types';
import { Guild, Presence, User } from '../../models';
import type { PartialEntity } from '../../types';
import Event from '../Event';

interface PresenceUpdateRefs {
  presence: Presence;
  guild: PartialEntity<Guild> | null;
  user: PartialEntity<User>;
  old: Presence | null;
}

export default class PresenceUpdateEvent extends Event<GatewayPresenceUpdateDispatchData, PresenceUpdateRefs> {
  get new() {
    return this.$refs.presence;
  }

  get old() {
    return this.$refs.old;
  }

  get user() {
    return this.$refs.user;
  }

  get guild() {
    return this.$refs.guild;
  }

  process() {
    const guild = this.data.guild_id !== undefined
      ? this.client.guilds.get(this.data.guild_id)
      : null;

    const old = guild?.presences.get(this.data.user.id) ?? null;
    const user = this.client.users.get(this.data.user.id) || { id: this.data.user.id };

    if (user!.id !== this.data.user.id) return;

    this.$refs = {
      presence: new Presence(this.client, this.data),
      guild,
      user,
      old
    };
  }
}
