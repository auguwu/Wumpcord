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
import { EventEmitter } from 'events';
import * as Constants from '../util/Constants';
import * as events from './events';
import WebSocket from 'ws';

let zlib = null;
try {
  zlib = require('zlib-sync');
} catch {
  try {
    zlib = require('pako');
  } catch {
    // ignore
  }
}

// If we should use JSON instead of erlpack
let useJSON = false;
try {
  require('erlpack');
  useJSON = false;
} catch {
  useJSON = true;
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
  /** The heartbeat interval */
  private _heartbeatInterval?: NodeJS.Timer;

  /** Time to reconnect */
  private reconnectTime: number = 30000;

  /** The status of the shard */
  public status: ShardStatus = ShardStatus.Unknown;

  /** Number of attempts the shard had to be after connecting */
  public attempts: number;

  /** The session ID */
  public sessionID: string | null;

  /** The sequence number */
  public sequence: number;

  /** The WebSocket itself */
  public socket?: WebSocket;

  /** List of guilds avaliable to this shard */
  public guilds: Set<string>;

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
    if (this.client.options.ws.compress && zlib === null) {
      this.emit('error', this.id, new Error('Couldn\'t find zlib-sync/pako! Cannot compress data.'));
      return;
    }

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

  private onPacket(event: any) {
    this.debug(`Received packet "${event.t}"`);
  }

  private initialise() {
    this.debug('Now initialising...');

    
  }
}