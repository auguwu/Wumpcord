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

import type { APITeamMember } from 'discord-api-types';
import type WebSocketClient from '../../gateway/WebSocketClient';
import { User } from '../User';

export default class TeamMember {
  public permissions!: string[];
  public membership!: number;
  private client: WebSocketClient;
  public teamID!: string;
  public user!: User;

  constructor(client: WebSocketClient, data: APITeamMember) {
    this.client = client;
    this.patch(data);
  }

  private patch(data: APITeamMember) {
    if (data.permissions !== undefined)
      this.permissions = data.permissions;

    if (data.membership_state !== undefined)
      this.membership = data.membership_state;

    if (data.team_id !== undefined)
      this.teamID = data.team_id;

    if (data.user !== undefined)
      this.user = this.client.users.add(new User(this.client, data.user));
  }

  toString() {
    return `[wumpcord.TeamMember<U: ${this.user.tag}, T: ${this.teamID}>]`;
  }
}
