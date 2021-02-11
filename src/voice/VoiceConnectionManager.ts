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

import type { GatewayVoiceServerUpdateDispatchData } from 'discord-api-types';
import type WebSocketClient from '../gateway/WebSocketClient';
import VoiceConnection from './VoiceConnection';
import { Collection } from '@augu/collections';

interface PendingGuild {
  resolve(connection: VoiceConnection): void;
  reject(error?: any): void;
  channelID: string;
  timeout: NodeJS.Timeout | null;
  guildID: string;
}

export default class VoiceConnectionManager extends Collection<string, VoiceConnection> {
  private pending: { [x: string]: PendingGuild };
  private client: WebSocketClient;

  constructor(client: WebSocketClient) {
    super();

    this.pending = {};
    this.client = client;
  }

  private debug(message: string) {
    this.client.debug('VoiceConnectionManager', message);
  }

  join(guildID: string, channelID: string) {
    const connection = this.get(guildID);
    if (connection && connection.ws.ready) {
      connection.switch(channelID);
      return Promise.resolve(connection);
    }

    return new Promise<VoiceConnection>((resolve, reject) => {
      this.debug(`Creating a pending packet! (guild_id=${guildID},channel_id=${channelID})`);
      this.pending[guildID] = {
        resolve,
        reject,

        timeout: setTimeout(() => {
          delete this.pending[guildID];
          return reject(new Error('Establishing connection has timed out'));
        }, 15000).unref(),

        channelID,
        guildID
      };

      this.client.shards.find(r => r.guilds.has(guildID))?.send(4, {
        channel_id: channelID,
        guild_id: guildID,
        self_mute: false,
        self_deaf: false
      });
    });
  }

  leave(guildID: string) {
    const connection = this.get(guildID);
    connection?.reset();

    this.delete(guildID);
    this.client.shards.find(r => r.guilds.has(guildID))?.send(4, {
      channel_id: null,
      self_mute: false,
      self_deaf: true,
      guild_id: guildID
    });
  }

  onVoiceServerUpdate(data: GatewayVoiceServerUpdateDispatchData) {
    this.debug(`Received \`VOICE_SERVER_UPDATE\` for guild ${data.guild_id}`);

    const pending = this.pending[data.guild_id];
    if (!pending) {
      this.debug('Missing pending data for guild, assuming it\'s not us.');
      return;
    }

    const connection = this.emplace(data.guild_id, new VoiceConnection(this.client, data.guild_id, pending.channelID));
    connection.onVoiceServerUpdate(data);

    const establishHandler = () => {
      this.debug(`Established a voice connection (guild_id=${data.guild_id})`);
      pending.resolve(connection);

      connection.removeListener('establish', establishHandler);
      delete this.pending[data.guild_id];
    };

    connection.once('establish', establishHandler);
  }
}
