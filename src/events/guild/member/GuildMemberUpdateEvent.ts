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

import type { GatewayGuildMemberUpdateDispatchData } from 'discord-api-types';
import { Guild, GuildMember } from '../../../models';
import { PartialEntity } from '../../../types';
import Event from '../../Event';

interface GuildMemberUpdateRefs {
  updated: GuildMember;
  old: PartialEntity<GuildMember> | null;
}

export default class GuildMemberUpdateEvent extends Event<GatewayGuildMemberUpdateDispatchData, GuildMemberUpdateRefs> {
  get member() {
    return this.$refs.updated;
  }

  get old() {
    return this.$refs.old;
  }

  process() {
    const guild = this.client.guilds.get(this.data.guild_id) ?? { id: this.data.guild_id };
    if (guild instanceof Guild) {
      if (this.data.user === undefined) {
        this.$refs = { old: null, updated: new GuildMember(this.client, <any> this.data) };
        return;
      }

      const member = guild.members.get(this.data.user.id) ?? { id: this.data.user.id };
      let old = member;

      if (member instanceof GuildMember) {
        member.patch(this.data);
        guild.members.cache.set(member.user.id, member);

        this.$refs = { old, updated: member };
        return;
      }
    }

    this.$refs = {
      updated: new GuildMember(this.client, <any> this.data),
      old: this.data.user !== undefined ? { id: this.data.user.id } : null
    };
  }
}
