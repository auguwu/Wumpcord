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

import type WebSocketClient from '../gateway/WebSocketClient';
import { DiscordRestError } from '../errors/DiscordRestError';
import type { APIRole } from 'discord-api-types';
import BaseManager from './BaseManager';
import GuildRole from '../models/guild/GuildRole';

export default class GuildRoleManager extends BaseManager<GuildRole> {
  constructor(client: WebSocketClient) {
    super(client, GuildRole);
  }

  fetch(guildID: string, roleID: string) {
    return this.client.rest.dispatch<APIRole[]>({
      endpoint: `/guilds/${guildID}/roles`,
      method: 'GET'
    }).then(data => {
      const role = data.find(role => role.id === roleID);
      if (!role) throw new DiscordRestError(404, `Role "${roleID}" was not found in guild "${guildID}"`);

      return this.add(new GuildRole(this.client, { guild_id: guildID, ...role })); // eslint-disable-line camelcase
    });
  }
}
