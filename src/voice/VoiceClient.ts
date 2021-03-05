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
import VoiceConnection from './VoiceConnection';
import { VoiceChannel } from '../models/channel/VoiceChannel';
import { Collection } from '@augu/collections';

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

  #client: WebSocketClient;

  constructor(client: WebSocketClient) {
    this.connections = new Collection();
    this.#client = client;
  }

  /**
   * Joins a voice channel and starts a connection with Discord
   * @param channel The voice channel or the ID of the channel
   * @throws {TypeError} If the voice channel's ID isn't a string
   * @returns A Promise of the connected voice connection (if any) or
   * a new [VoiceConnection].
   */
  joinChannel(channel: string | VoiceChannel) {
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

    const connection = this.connections.get(`${chan.guild.id}:${chan.id}`);
    if (connection !== undefined)
      return Promise.resolve(connection);

    return new VoiceConnection(); // noop fix
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
    // noop
  }
}
