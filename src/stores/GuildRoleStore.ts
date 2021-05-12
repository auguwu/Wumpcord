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

import type { WebSocketClient } from '../Client';
import { DiscordRestError } from '@wumpcord/rest';
import type { APIRole } from 'discord-api-types';
import { BaseStore } from './BaseStore';
import { Role } from '../entities/Role';

export class GuildRoleStore extends BaseStore<Role> {
  constructor(client: WebSocketClient) {
    super(client, 'roles');
  }

  /**
   * Method to return a [[Role]] from the specified [[`guildID`]]
   * @param guildID The guild ID to fetch the role from
   * @param roleID The role ID to use to find the role
   * @returns Promise of a [[Role]] instance resolved OR a Promise that rejects this call and throws a [[DiscordRestError]].
   */
  fetch(guildID: string, roleID: string) {
    return this.client.rest.dispatch<unknown, APIRole[]>({
      endpoint: '/guilds/:guildID/roles',
      method: 'GET',
      query: { guildID },
      auth: true
    }).then(roles => {
      const role = roles.find(r => r.id === roleID);
      if (!role)
        throw new DiscordRestError(10019, `Unknown Role (${roleID})`);

      // const guild = this.client.guilds.get(guildID);
      // if (guild) guild.roles.put(new Role(role));

      return new Role(role);
    });
  }
}
