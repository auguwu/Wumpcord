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

import type { GatewayGuildMemberAddDispatchData } from 'discord-api-types';
import type { PartialEntity } from '../../../types';
import { Guild, GuildMember } from '../../../models';
import Event from '../../Event';

interface GuildMemberAddRefs {
  member: GuildMember;
  guild: PartialEntity<Guild>;
}

export default class GuildMemberAddEvent extends Event<GatewayGuildMemberAddDispatchData, GuildMemberAddRefs> {
  /**
   * Getter if the member hasn't passed the **Member Screening** panel. Use
   * a timeout (`setTimeout`) to check if `pending` is now the value you want.
   *
   * Useful for Autoroles and such.
   */
  get pending() {
    return this.$refs.member.pending;
  }

  /**
   * Returns the reference for the member that joined the guild.
   */
  get member() {
    return this.$refs.member;
  }

  /**
   * Returns a partial or a full guild, a partial guild only contains a object as
   * `{ id: String }` while a full guild has all metadata, this is purely based
   * on cache.
   */
  get guild() {
    return this.$refs.guild;
  }

  process() {
    const guild = this.client.guilds.get(this.data.guild_id) ?? { id: this.data.guild_id };
    const member = new GuildMember(this.client, this.data);
    if (guild instanceof Guild) guild.members.add(member);

    this.$refs = { guild, member };
  }
}
