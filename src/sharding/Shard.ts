/**
 * Copyright (c) 2020 August
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

import type { ShardedClient } from './ShardedClient';
import { pack, unpack } from 'erlpack';
import { EventEmitter } from 'events';
import * as Constants from '../util/Constants';
import * as events from './events';
import WebSocket from 'ws';

interface SendActivityOptions {
  name: string;
  type: Constants.ActivityStatus;
  url?: string;
  afk?: boolean;
}

export enum ShardStatus {
  Unknown = 'unknown',
  Throttling = 'throttling',
  Dead = 'dead',
  Connected = 'connected'
}

/**
 * Represents a "shard" to connect to Discord's API
 *
 * Based on Eris' sharding API, so credits goes to abal!
 */
export class Shard extends EventEmitter {
  private _heartbeatInterval?: NodeJS.Timer;
  public lastReceived: number = 0;
  private reconnectTime: number = 30000;
  public status: ShardStatus = ShardStatus.Unknown;
  public lastSent: number = 0;
  public attempts: number;
  public sessionID: string | null;
  public sequence: number;
  public acked: boolean = false;
  public socket?: WebSocket;
  public guilds: Set<string>;
  public ping: number = Infinity;

  /**
   * Creates a new Shard
   * @param client The sharded client
   * @param id The shard's ID
   */
  constructor(private client: ShardedClient, public id: number) {
    super();

    this._heartbeatInterval = undefined;
    this.sessionID = null;
    this.attempts = 0;
    this.sequence = 0;
    this.guilds = new Set();
  }

  /**
   * Connects the shard
   */
  connect() {
    if (this.socket && this.socket.readyState != WebSocket.CLOSED) {
      this.emit('error', this.id, new Error('Socket is already connected'));
      return;
    }

    this.status = ShardStatus.Throttling;
    ++this.attempts;
    return this.initialise();
  }

  /**
   * Disconnects the shard
   * @param reconnect If we should reconnect or not
   */
  disconnect(reconnect: boolean = true) {
    if (!this.socket) return;
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = undefined;
    }

    if (this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.removeListener('close', this._onClose.bind(this));
      try {
        if (reconnect && this.sessionID !== null) {
          if (this.socket.readyState === WebSocket.OPEN) this.socket.close(4901, 'Reconnect: Wumpcord');
          else this.socket.terminate();
        } else {
          this.socket.close(1000, 'Reconnect: Wumpcord');
        }
      } catch(ex) {
        this.emit('error', this.id, ex);
      }
    }

    this.socket = undefined;
    this.emit('disconnect');

    if (this.sessionID && this.client.options.ws.tries >= this.attempts) {
      this.debug(`Tried to validate session but reached ${this.client.options.ws.tries} tries.`);
      this.sessionID = null;
    }

    if (reconnect) {
      if (this.sessionID) {
        this.debug(`Now connecting to potentially resume | Attempt #${this.attempts}`);
        this.client.shards.connect(this);
      } else {
        this.debug(`Queueing a reconnect in ${this.reconnectTime}ms | Attempt #${this.attempts}`);

        setTimeout(() => this.client.shards.connect(this), this.reconnectTime);
        this.reconnectTime = Math.min(Math.round(this.reconnectTime * (Math.random() * 2 + 1)), 30000);
      }
    } else {
      this.hardReset();
    }
  }

  send<T = unknown>(op: Constants.OPCodes, data?: T) {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      const packet = pack({ op, d: data });
      this.socket.send(packet);
      this.debug(`Sent to Discord: ${packet}`);
    }
  }

  private hardReset() {
    this.status = ShardStatus.Dead;
    this.sequence = 0;
    this.sessionID = null;
    this.socket = undefined;

    this.debug('Hard resetted this shard');
  }

  private debug(message: string) {
    this.emit('debug', this.id, message);
  }

  private identify() {
    const identify: { [x: string]: any } = {
      token: this.client.token,
      v: Constants.GatewayVersion,
      compress: Boolean(this.client.options.ws.compress),
      large_threshold: Boolean(this.client.options.ws.largeThreshold),
      guild_subscriptions: Boolean(this.client.options.ws.guildSubscriptions),
      intents: this.client.options.ws.intents,
      properties: {
        'os': process.platform,
        'browser': 'Wumpcord',
        'device': 'Wumpcord'
      }
    };

    if (this.client.options.shardCount > 1) identify.shard = [this.id, this.client.options.shardCount];
    this.send(Constants.OPCodes.Identify, identify);
  }

  private async initialise() {
    this.debug('Now initialising...');

    const uri = await this.client.getBotGateway();
    this.socket = new WebSocket(uri, this.client.options.ws.clientOptions);

    this.socket.on('open', this._onOpen.bind(this));
    this.socket.on('close', this._onClose.bind(this));
    this.socket.on('error', this._onError.bind(this));
    this.socket.on('message', this._onMessage.bind(this));

    setTimeout(() => {
      if (this.status === ShardStatus.Throttling) this.disconnect(true);
    }, this.client.options.ws.connectTimeout);
  }

  private _onOpen() {
    this.debug('Opened a connection to Discord!');
    this.emit('establish', this.id);
  }

  private _onClose(code: number, reason: string) {
    const isRecoverable = Constants.UnrecoverableCodes.includes(code);
    if (code) {
      this.debug(`Received a ${code === 1000 ? 'clean' : 'unclean'} WebSocket close for ${reason === '' ? 'no reason' : reason} (code: ${code}, recoverable: ${isRecoverable ? 'yes' : 'no'})`);
      
      let error = new Error(`${code}: ${reason === '' ? 'None' : reason}`);
      switch (code) {
        case 4001: {
          error = new Error('Gateway received an invalid OPCode');
        } break;

        case 4002: {
          error = new Error('Gateway received an invalid message');
        } break;

        case 4003: {
          error = new Error('Gateway wasn\'t authenicated');
          this.sessionID = null;
        } break;

        case 4004: {
          error = new Error('Authenication failed while logging in');
          this.sessionID = null;
          this.emit('error', new Error(`Invalid token "${this.client.token}"`));
        } break;

        case 4005: {
          error = new Error('Gateway is already authenicated');
        } break;

        case 4006:
        case 4009: {
          error = new Error('Invalid session');
          this.sessionID = null;
        } break;

        case 4007: {
          error = new Error(`Invalid sequence number: ${this.sequence}`);
          this.sequence = 0;
        } break;

        case 4008: {
          error = new Error('Ratelimited while authenicating/sending packets');
        } break;

        case 4010: {
          error = new Error('Invalid shard');
          this.sessionID = null;
        } break;

        case 4011: {
          error = new Error('Shard includes too many guilds (>2500)');
          this.sessionID = null;
        } break;

        case 4013: {
          error = new Error('Invalid intents were specified');
          this.sessionID = null;
        } break;

        case 4014: {
          error = new Error('Disallowed intents were specified');
          this.sessionID = null;
        } break;

        case 1006: {
          error = new Error('Connection was reset');
        } break;
      }

      this.emit('error', this.id, error, isRecoverable);
    } else {
      this.debug(`Unknown WS code: ${code}`);
    }

    this.disconnect(isRecoverable);
  }

  private _onError(error: Error) {
    this.emit('error', this.id, error);
  }

  private _onMessage(packet: any) {
    const data = unpack(packet);
    console.log(data);
    if (data.includes('s')) {
      this.debug(`Received new sequence number: ${data.s}`);
      this.sequence = data.s;
    }

    switch (data.op) {
      case Constants.OPCodes.Event: {
        if (!this.client.options.disabledEvents.includes(data.t)) {
          const event = events[data.t].apply(this);
          event(data.d);
        }
      } break;

      case Constants.OPCodes.Heartbeat: {
        this.ackHeartbeat();
      } break;

      case Constants.OPCodes.InvalidSession: {
        this.sequence = 0;
        this.sessionID = null;
        this.emit('warn', this.id, 'Invalid session has occured.');
        this.identify();
      } break;

      case Constants.OPCodes.Reconnect: {
        this.disconnect();
      } break;

      case Constants.OPCodes.Hello: {
        if (data.d.heartbeat_interval > 0) {
          if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
          this._heartbeatInterval = setInterval(this.ackHeartbeat, data.d.heartbeat_interval);
        }

        this.status = ShardStatus.Connected;
        if (this.sessionID) this.resume();
        else {
          this.identify();
          this.ackHeartbeat();
        }

        this.debug(`Received "HELLO" packet!\n${data.d._trace}`);
      } break;

      case Constants.OPCodes.HeartbeatAck: {
        this.acked = true;
        this.lastReceived = new Date().getTime();
        this.ping = (this.lastReceived - this.lastSent);
      } break;

      default: {
        this.emit('unknown', data, this.id);
      } break;
    }
  }

  private ackHeartbeat() {
    if (this.status === ShardStatus.Throttling) return;
    
    this.lastSent = new Date().getTime();
    this.send(Constants.OPCodes.Heartbeat, this.sequence);
  }

  private resume() {
    this.send(Constants.OPCodes.Resume, {
      session_id: this.sessionID,
      token: `Bot ${this.client.token}`,
      seq: this.sequence
    });
  }

  setStatus(status: 'offline' | 'online' | 'idle' | 'dnd', opts: SendActivityOptions) {
    this.debug(`Updating status to "${status}" (${JSON.stringify(opts)})`);
    this.send(Constants.OPCodes.StatusUpdate, {
      status,
      since: status === 'idle' ? Date.now() : 0,
      game: {
        name: opts.name,
        type: opts.type,
        url: opts.url
      },
      afk: opts.hasOwnProperty('afk') ? Boolean(opts.afk!) : false
    });
  }
}