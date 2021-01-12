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

import type { GatewayGuildMembersChunkDispatchData } from 'discord-api-types';
import { Guild, GuildMember, Presence } from '../../../models';
import type { PartialEntity } from '../../../types';
import { Collection } from '@augu/collections';
import Event from '../../Event';

interface GuildMemberChunkRefs {
  chunkCount: number;
  chunkIndex: number;
  members: Collection<string, GuildMember>;
  nonce?: string;
  guild: PartialEntity<Guild>;
}

export default class GuildMemberChunkEvent extends Event<GatewayGuildMembersChunkDispatchData, GuildMemberChunkRefs> {
  get chunkIndex() {
    return this.$refs.chunkIndex;
  }

  get chunkCount() {
    return this.$refs.chunkCount;
  }

  get members() {
    return this.$refs.members;
  }

  get nonce() {
    return this.$refs.nonce;
  }

  get guild() {
    return this.$refs.guild;
  }

  process() {
    const guild = this.client.guilds.get(this.data.guild_id) ?? { id: this.data.guild_id };
    const members = new Collection<string, GuildMember>();

    for (let i = 0; i < this.data.members.length; i++) {
      const member = this.data.members[i];
      members.set(member.user!.id, new GuildMember(this.client, member));
    }

    if (this.data.presences !== undefined) {
      for (let i = 0; i < this.data.presences.length; i++) {
        if (guild instanceof Guild) guild.presences.add(new Presence(this.client, this.data.presences[i]));
      }
    }

    this.$refs = {
      members,
      guild,
      chunkCount: this.data.chunk_count ?? 0,
      chunkIndex: this.data.chunk_index ?? 0,
      nonce: this.data.nonce
    };
  }
}
