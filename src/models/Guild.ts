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
/* eslint-disable camelcase */

import GuildVoiceStateManager from '../managers/GuildVoiceStateManager';
import type WebSocketClient from '../gateway/WebSocketClient';
import GuildPresenceManager from '../managers/GuildPresencesManager';
import GuildMemberManager from '../managers/GuildMemberManager';
import GuildEmojiManager from '../managers/GuildEmojiManager';
import GuildRoleManager from '../managers/GuildRoleManager';
import GuildIntegration from './guild/GuildIntegration';
import ChannelManager from '../managers/ChannelManager';
import GuildPreview from './guild/GuildPreview';
import GuildEmoji from './guild/GuildEmoji';
import GuildRole from './guild/GuildRole';
import GuildBan from './guild/GuildBan';
import Webhook from './Webhook';
import Base from './Base';
import Util from '../util';

import type {
  APIGuild
} from 'discord-api-types';

interface IGuild extends APIGuild {
  shard_id: number;
}

export class Guild extends Base<IGuild> {
  // Properties that are added when constructing FIRST
  public presences: GuildPresenceManager;
  public channels: ChannelManager;
  public members: GuildMemberManager;
  private client: WebSocketClient;
  public emojis: GuildEmojiManager;
  public roles: GuildRoleManager;

  // Properties added using Guild.patch
  public afkChannelID!: string | null;
  public discoverySplash!: string | null;
  public afkTimeout!: number;
  public iconHash!: string | null;
  public ownerID!: string;
  public region!: string;
  public owner!: boolean;
  public icon!: string | null;
  public name!: string;

  constructor(client: WebSocketClient, data: IGuild) {
    super(data.id);

    this.presences = new GuildPresenceManager(client);
    this.channels = new ChannelManager(client);
    this.members = new GuildMemberManager(client);
    this.client = client;
    this.emojis = new GuildEmojiManager(client);
    this.roles = new GuildRoleManager(client);

    this.patch(data);
  }
}
