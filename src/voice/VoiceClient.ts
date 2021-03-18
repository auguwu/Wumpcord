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

/* eslint-disable camelcase */

import type { GatewayVoiceServerUpdateDispatchData } from 'discord-api-types';
import type WebSocketClient from '../gateway/WebSocketClient';
import VoiceConnection from './VoiceConnection';
import { VoiceChannel } from '../models/channel/VoiceChannel';
import { Collection } from '@augu/collections';
import { OPCodes } from '../Constants';
import Util from '../util';

interface PendingGuildPacket {
  resolve(value: VoiceConnection): void;
  reject(error: Error): void;

  channelID: string;
  timeout: NodeJS.Timeout;
  guildID: string;
}

export interface JoinChannelOptions {
  /**
   * If the bot should be deafened when joining a channel
   */
  deaf?: boolean;

  /**
   * If the bot should be muted when joining a voice channel
   */
  mute?: boolean;
}

/**
 * Represents a client to interact and dispatch voice connections with.
 *
 * ### Joining a voice channel
 * ```js
 * const { Client } = require('wumpcord');
 *
 * const client = new Client({ token: '' });
 * client.on('message', event => {
 *    if (event.message.content === '!join') {
 *       const channelID = event.message.member?.voiceState?.channelID;
 *       if (!channelID) return event.channel.send('Can\'t connect to voice channel without being in one!');
 *
 *       const channel = this.client.channels.get(channelID);
 *       if (!channel || channel.type !== 'voice') return event.channel.send('Channel wasn\'t found or it\'s not a voice channel.');
 *
 *       // Option 1. Use voice client
 *       return client.voice.joinChannel(channel).then(() => event.channel.send('Joined!')).catch(console.error);
 *
 *       // Option 2. Use `VoiceChannel.join()`
 *       return channel.join().then(() => event.channel.send('Joined!')).catch(console.error);
 *    }
 * });
 *
 * client.connect();
 * ```
 */
export default class VoiceClient {
  /**
   * List of connection nodes that is attached to this [VoiceClient]
   */
  public connections: Collection<string, VoiceConnection>;

  #pending: { [x: string]: PendingGuildPacket };
  #client: WebSocketClient;

  constructor(client: WebSocketClient) {
    this.connections = new Collection();
    this.#pending = {};
    this.#client = client;
  }

  /**
   * Joins a voice channel and starts a connection with Discord
   * @param channel The voice channel or the ID of the channel
   * @throws {TypeError} If the voice channel's ID isn't a string
   * @returns A Promise of the connected voice connection (if any) or
   * a new [VoiceConnection].
   */
  joinChannel(channel: string | VoiceChannel, options?: JoinChannelOptions) {
    const joinOpts = Util.merge<JoinChannelOptions>(options!, { mute: false, deaf: false });
    let chan!: VoiceChannel;

    if (typeof channel === 'string') {
      const _chan = this.#client.channels.get<VoiceChannel>(channel);
      if (!_chan)
        throw new TypeError(`Channel '${channel}' was not found`);

      if (_chan.type !== 'voice')
        throw new TypeError(`Channel ${_chan.name ?? '(not a guild channel)'} was not a voice channel`);

      chan = _chan;
    } else if (!(channel instanceof VoiceChannel)) {
      throw new TypeError(`\`channel\` param was not a voice channel, received ${(typeof channel === 'object' || typeof channel === 'function') ? (channel as any).constructor.name : typeof channel}`);
    } else {
      chan = channel;
    }

    const connection = this.connections.get(chan.guild.id);
    if (connection !== undefined)
      return Promise.resolve(connection);

    return new Promise<VoiceConnection>((resolve, reject) => {
      this.#client.debug(`VoiceClient/${chan.id}/${chan.guild.id}`, 'Voice channel and guild are now pending for a connection...');
      this.#pending[chan.guild.id] = {
        resolve,
        reject,

        channelID: chan.id,
        timeout: setTimeout(() => {
          delete this.#pending[chan.guild.id];
          return reject(new Error('Pending packet has timed out of a new connection.'));
        }, 15000).unref(),
        guildID: chan.guild.id
      };

      const shard = (this.#client.shards.get(chan.guild.shardID) ?? this.#client.shards.get(0))!;
      shard.send(OPCodes.VoiceStateUpdate, {
        channel_id: chan.id,
        self_mute: joinOpts.mute,
        self_deaf: joinOpts.deaf,
        guild_id: chan.guild.id
      });

      const connection = new VoiceConnection(this.#client, chan);
      this.connections.set(chan.guild.id, connection);
    });
  }

  /**
   * Leaves a voice channel and disconnects the voice connection
   * node with it.
   *
   * @param channel The channel (or the channel's ID)
   * @throws {TypeError} If `channel` was not found, the voice connection isn't found, or if
   * `channel` was not a [VoiceChannel] instance.
   * @returns A boolean value if a channel was left or not
   */
  leaveChannel(channel: string | VoiceChannel) {
    let chan!: VoiceChannel;

    if (typeof channel === 'string') {
      const _chan = this.#client.channels.get<VoiceChannel>(channel);
      if (!_chan)
        throw new TypeError(`Channel '${channel}' was not found`);

      if (_chan.type !== 'voice')
        throw new TypeError(`Channel ${_chan.name ?? '(not a guild channel)'} was not a voice channel`);

      chan = _chan;
    } else if (!(channel instanceof VoiceChannel)) {
      throw new TypeError(`\`channel\` param was not a voice channel, received ${(typeof channel === 'object' || typeof channel === 'function') ? (channel as any).constructor.name : typeof channel}`);
    } else {
      chan = channel;
    }

    if (this.#pending.hasOwnProperty(chan.guild.id)) {
      const packet = this.#pending[chan.guild.id];
      clearTimeout(packet.timeout);

      delete this.#pending[chan.guild.id];
    }

    const connection = this.connections.get(chan.guild.id);
    connection?.reset();

    this.connections.delete(chan.guild.id);
  }

  onVoiceServerUpdate(packet: GatewayVoiceServerUpdateDispatchData) {
    this.#client.debug('VoiceClient', `Received a voice server update packet for guild ${packet.guild_id}!`);

    const pending = this.#pending[packet.guild_id];
    if (!pending) {
      this.#client.debug('VoiceClient', 'Missing pending packet from guild, assuming it\'s not us.');
      return;
    }

    const connection = this.connections.get(packet.guild_id)!;
    connection.onVoiceServerUpdate(packet);

    const connectedHandler = () => {
      this.#client.debug(`VoiceClient/${connection.channel.guild.id}/${connection.channel.id}`, 'Established a voice connection.');
      pending.resolve(connection);

      connection.removeListener('connected', connectedHandler);
      delete this.#pending[packet.guild_id];
    };

    connection.once('connected', connectedHandler);
  }
}
