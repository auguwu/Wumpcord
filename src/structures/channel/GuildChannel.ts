/**
 * Copyright (c) 2020 August
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

import type { GuildChannelPacket } from '../../util/models';
import type { Client } from '../../Client';
import { Collection } from '@augu/immutable';
import { Channel } from '../Channel';
import { Guild } from '../Guild';

type PartialGuild = Guild | { id: string };

export class GuildChannel extends Channel {
  public permissionOverwrites!: number | Collection<PermissionOverwrite>;
  public guild: PartialGuild;

  constructor(client: Client, data: GuildChannelPacket) {
    super(client, data);

    this.guild = typeof this.client.guilds === 'number' // If we aren't allowed to cache the guilds
      ? { id: data.guild_id }
      : this.client.guilds.get(data.guild_id) || { id: data.guild_id };

    this.update(data);
  }

  update(data: GuildChannelPacket) {
  
  }
}
