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

import { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } from 'discord-api-types';
import { getConverter, getOpus } from '.';
import { User, VoiceChannel } from '../models';
import type WebSocketClient from '../gateway/WebSocketClient';
import { VoiceOPCodes } from './Constants';
import WebSocketNetwork from './networks/WebSocketNetwork';
import { Collection } from '@augu/collections';
import { OPCodes } from '../Constants';
import { Stream } from 'stream';
import UDPNetwork from './networks/UDPNetwork';
import Converter from './Converter';
import EventBus from '../util/EventBus';
import Util from '../util';

interface VoiceConnectionEvents {
  'user.disconnect'(user: User | string): void;
  stopSpeaking(user: User | string, self: boolean): void;
  establish(): void;
  speaking(user: User | string, self: boolean): void;
  debug(message: string): void;
  close(code: number, reason: string): void;
  error(error: Error): void;
  stop(): void;
  end(): void;
}

interface ReadyPromise {
  resolve(value: any): void;
  reject(error?: any): void;
}

export default class VoiceConnection extends EventBus<VoiceConnectionEvents> {
  private playbackInterval!: NodeJS.Timer;
  public userSpeaking: Collection<string, boolean>;
  public converter: Converter | null;
  public channelID: string;
  public speaking: boolean;
  private client: WebSocketClient;
  public guildID: string;
  public _ready!: ReadyPromise;
  public udp: UDPNetwork | null;
  public ws: WebSocketNetwork;

  constructor(client: WebSocketClient, guildID: string, channelID: string) {
    super();

    if (!Util.hasNaclInstalled()) throw new TypeError('Missing `tweetnacl` library, please install it');
    if (getOpus() === null) throw new TypeError('Missing `@discordjs/opus` or `opusscript` libraries, please install it');

    this.userSpeaking = new Collection();
    this.channelID = channelID;
    this.speaking = false;
    this.converter = null;
    this.client = client;
    this.guildID = guildID;
    this.udp = null;
    this.ws = new WebSocketNetwork(this);

    new Promise((resolve, reject) => (this._ready = { resolve, reject }, void 0));
  }

  onVoiceStateUpdate(update: GatewayVoiceStateUpdateDispatchData) {
    this.debug('Received a voice state update');
    this.ws.setSession(update);
  }

  onVoiceServerUpdate(update: GatewayVoiceServerUpdateDispatchData) {
    this.debug('Received a voice server update');
    this.ws.spawn(update);
  }

  debug(message: string, title?: string) {
    if (!title)
      title = `[VoiceConnection/${this.guildID}/${this.channelID}]`;
    else
      title = `[${title}]`;

    this.emit('debug', `${title} ${message}`);
  }

  speak() {
    this.speaking = !this.speaking;
    this.ws.send(VoiceOPCodes.Speaking, {
      speaking: this.speaking === true ? 1 << 0 : 0,
      delay: 0,
      ssrc: this.ws.ssrc
    });
  }

  get guild() {
    return this.client.guilds.get(this.guildID);
  }

  get channel() {
    return this.client.channels.get(this.guildID);
  }

  async play(source: string | Stream, replace: boolean = false) {
    if (
      !replace &&
      this.converter !== null &&
      !this.converter.ended &&
      this.converter.packets.length > 0
    ) throw new Error('Already playing a stream');

    if (!this.ws.ready) throw new Error('WebSocket or UDP connection isn\'t ready');
    if (!this.speaking) this.speak();

    this.converter = await getConverter(this, source);
    if (this.converter === null) throw new Error('Unable to get a converter, must be a file path or Readable stream');

    this.playbackInterval = setInterval(() => {
      // Even though the converter ended, this doesn't mean the packet queue isn't empty
      // So we have to also make sure the packet queue is empty, before we stop
      if (this.converter!.ended && !this.converter!.packets.length) {
        clearInterval(this.playbackInterval);
        this.emit('end');

        return;
      }

      const packet = this.converter!.provide();
      if (!packet) return;

      this.udp!.sendPacket(packet);
    }, 20);

    this.playbackInterval.unref();
  }

  reset() {
    this.debug('Resetting connection');

    this.udp?.reset();
    this.ws.clean();

    try {
      this.udp?.disconnect();
    } catch(ex) {
      if (ex.message.indexOf('Not running') !== -1) return;

      this.debug(ex);
    }
  }

  switch(channel: VoiceChannel | string) {
    if (typeof channel !== 'string' && !(channel instanceof VoiceChannel)) throw new Error('`channel` is not a voice channel');

    const id = typeof channel === 'string' ? channel : channel.id;
    this.channelID = id;
    this.guild!.shard!.send(OPCodes.VoiceStateUpdate, {
      guild_id: this.guildID,
      channel_id: id,
      self_mute: false,
      self_deaf: false
    });
  }
}
