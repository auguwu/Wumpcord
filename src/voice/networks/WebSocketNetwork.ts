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
import type { GatewayVoiceStateUpdateDispatchData, GatewayVoiceServerUpdateDispatchData } from 'discord-api-types';
import type VoiceConnection from './VoiceConnection';
import * as constants from '../Constants';
import UDPNetwork from './UDPNetwork';
import WebSocket from 'ws';
import Util from '../../util';

export default class WebSocketNetwork {
  private _heartbeatInterval!: NodeJS.Timer;
  public lastHeartbeatAckAt!: number;
  public lastHeartbeatAt!: number;
  private connection: VoiceConnection;
  private sessionID: string | null;
  private socket!: WebSocket;
  private token: string | null;
  public ready: boolean;
  public acked: boolean;
  public ssrc!: string;

  constructor(connection: VoiceConnection) {
    this.connection = connection;
    this.sessionID = null;
    this.ready = false;
    this.acked = true;
    this.token = null;
  }

  get ping() {
    if (!this.lastHeartbeatAt || !this.lastHeartbeatAckAt) return 0;

    return (this.lastHeartbeatAckAt - this.lastHeartbeatAt);
  }

  spawn(update: GatewayVoiceServerUpdateDispatchData) {
    this.token = update.token;
    this.socket = new WebSocket(`wss://${update.endpoint}?v=4`);

    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.socket.on('open', this.onOpen.bind(this));
  }

  send<T>(op: number, data: T) {
    this.socket.send(JSON.stringify({
      op,
      d: data
    }));
  }

  selectProtocol(ip: string, port: number) {
    this.debug('Selecting protocol using "xsalsa20_poly1305"...');
    this.send(constants.VoiceOPCodes.SelectProtocol, {
      protocol: 'udp',
      data: {
        address: ip,
        port,
        mode: 'xsalsa20_poly1305'
      }
    });
  }

  setSession(update: GatewayVoiceStateUpdateDispatchData) {
    this.debug('Received VOICE_STATE_UPDATE event, caching session ID');
    this.sessionID = update.session_id;
  }

  private debug(message: string) {
    this.connection.debug(message, `WebSocket/${this.connection.guildID}/${this.connection.channelID}`);
  }

  private onOpen() {
    this.connection.emit('establish');
    this.debug('Established a WebSocket connection with Discord');
  }

  private onClose(code: number, reason: string) {
    this.debug(`Received close! (code=${code},reason=${reason})`);
  }

  private onMessage(data: any) {
    let payload!: any;
    try {
      payload = JSON.parse(data);
    } catch(ex) {
      this.debug(`Unable to decode packet\n${ex}`);
      this.connection.emit('error', ex);

      return;
    }

    this.debug(`Received "${Util.getKey(constants.VoiceOPCodes, data.op) ?? 'Unknown'}"`);
    switch (payload.op) {
      case constants.VoiceOPCodes.Hello: {
        if (!this._heartbeatInterval) {
          // We use "unref" because it doesn't require the event loop
          // to be active when we run this interval
          this._heartbeatInterval = setInterval(() => this.heartbeat(), payload.d.heartbeat_interval).unref();
        }

        this.debug('Received HELLO packet, identify...');
        this.send(constants.VoiceOPCodes.Identify, {
          session_id: this.sessionID,
          server_id: this.connection.guildID,
          user_id: this.connection.guild.client.user.id,
          token: this.token
        });

        this.heartbeat();
      } break;

      case constants.VoiceOPCodes.HeartbeatAck: {
        this.lastHeartbeatAckAt = Date.now();
        this.acked = true;

        this.debug(`Connection is stable (~${this.ping}ms)`);
      } break;

      case constants.VoiceOPCodes.Ready: {
        this.debug('Creating UDP network');

        this.connection.udp = new UDPNetwork(this.connection, payload.d.ip, payload.d.port);
        this.ssrc = payload.d.ssrc;
      } break;

      case constants.VoiceOPCodes.SessionDescription: {
        if (this.ready) break;

        this.debug('Received secret key, audio can now be sent');
        this.ready = true;
        this.connection.udp.secretKey = new Uint8Array(payload.d.secret_key);
        this.connection._ready.resolve();
      } break;
    }
  }

  private heartbeat() {
    this.lastHeartbeatAt = Date.now();
    this.send(constants.VoiceOPCodes.Heartbeat, this.lastHeartbeatAt);
  }
}
