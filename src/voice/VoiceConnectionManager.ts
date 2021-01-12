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
import type { User } from '../models';

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

  connect(channelID: string, guildID: string) {
    const connection = this.get(guildID);
    if (connection && connection.ws.ready) {
      connection.switch(channelID);

      if (connection.ws.ready)
        return Promise.resolve(connection);
    }

    return new Promise((resolve, reject) => {
      this.client.debug(`Voice Connection Manager => ${guildID}/${channelID}`, 'Established pending guild...');
      this.pending[guildID] = {
        resolve,
        reject,

        timeout: setTimeout(() => {
          delete this.pending[guildID];
          reject(new Error('Voice connection has timed out'));
        }, 15000).unref(),

        guildID,
        channelID
      };
    });
  }

  create(guildID: string, channelID: string) {
    if (this.has(guildID)) throw new TypeError(`Guild "${guildID}" and "${channelID}" have an active voice connection`);

    const connection = new VoiceConnection(this.client, guildID, channelID);

    this.set(guildID, connection);
    return connection;
  }

  destroy(guildID: string) {
    const connection = this.get(guildID);
    if (connection !== undefined) connection.reset();

    this.delete(guildID);
  }

  onVoiceServerUpdate(data: GatewayVoiceServerUpdateDispatchData) {
    this.client.debug(`Voice Connection => ${data.guild_id}`, 'Received `VOICE_SERVER_UPDATE` event');
    if (this.pending[data.guild_id] && this.pending[data.guild_id].timeout !== null) {
      clearTimeout(this.pending[data.guild_id].timeout!);
      this.pending[data.guild_id].timeout = null;
    }

    const pending = this.pending[data.guild_id];
    const connection = this.create(pending.guildID, pending.channelID);
    connection.onVoiceServerUpdate(data);

    const establishHandler = () => {
      this.client.debug(`Voice Connection => ${pending.guildID}`, 'Established a connection');
      pending.resolve(connection);

      delete this.pending[data.guild_id];
    };

    const onUserDisconnectHandler = (user: string | User) => {
      const id = typeof user === 'string' ? user : user.id;
      if (id === this.client.user.id) {
        this.client.debug(`Voice Connection => ${pending.guildID}`, 'Disconnected from voice');
        pending.reject(new Error('Disconnected'));

        try {
          connection.reset();
        } catch {
          // ignore
        }

        delete this.pending[data.guild_id];
        connection.remove('user.disconnect', onUserDisconnectHandler);
        connection.remove('establish', establishHandler);
      }
    };

    connection
      .on('establish', establishHandler)
      .on('user.disconnect', onUserDisconnectHandler);
  }
}
