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

import { GatewayEvents, OPCodes, ShardStatus, UnrecoverableCodes } from '../Constants';
import type { OnlineStatus, SendActivityOptions } from '../types';
import type { WebSocketClient } from '../Client';
import type * as discord from 'discord-api-types';
import { EventBus } from '@augu/utils';
import WebSocket from 'ws';
import Util from '../util';

export interface ShardEvents {
  /**
   * Emitted when this shard disconnects from Discord and is resuming
   * it's connection. This differs from [[ShardEvents.close]] due to
   * that just closes the connection *if* it can't be recovered.
   *
   * @param id The shard ID
   * @param error The error (if any)
   */
  disconnect(id: number, error?: Error): void;

  /**
   * Emitted when this shard disposes it's connection with Discord.
   * This differs from [[ShardEvents.close]] or [[ShardEvents.disconnect]]
   * since this is emitted when [[Shard.dispose]] is called.
   *
   * @param id The shard ID
   * @param error The error (if any)
   */
  disposed(id: number, error?: Error): void;

  /**
   * Emitted when this shard has established a end to end
   * connection with Discord. This is emitted when
   * the WebSocket connection is open.
   *
   * @param id The shard's ID
   */
  connect(id: number): void;

  /**
   * Emitted when this shard is resuming its connection.
   * @param id This shard's ID
   */
  resume(id: number): void;

  /**
   * Emitted when this shard is fully ready.
   * @param id This shard's ID
   * @param unavailableGuilds If there is any unavailable guilds
   */
  ready(id: number, unavailableGuilds?: Set<string>): void;

  /**
   * Emitted for any message related for debugging
   * @param id This shard's ID
   * @param message The message
   */
  debug(id: number, message: string): void;

  /**
   * Emitted when the shard has errored on a specific task
   * @param id This shard's ID
   * @param error The error
   */
  error(id: number, error: Error): void;

  /**
   * Emitted when this shard's end to end connection has been
   * disposed for whatever reason and cannot be recovered.
   *
   * @param id This shard's ID
   * @param code The close code
   * @param reason The reason (if any) why this shard is closed
   * @param recoverable If the close code is recoverable or not
   */
  close(id: number, code: number, reason?: Error, recoverable?: boolean): void;

  /**
   * Received when this shard has received a packet from Discord
   * @param id This shard's ID
   * @param data The data Discord sent
   */
  raw(id: number, data: any): void;
}

interface ErlpackDefinition {
  pack(data: any): Buffer;
  unpack<T>(data: Buffer): T;
}

let Erlpack: ErlpackDefinition | undefined = undefined;
try {
  Erlpack = require('erlpack');
} catch {
  // noop
}

interface ZlibSyncDefinition {
  Inflate: ZlibInflate;

  Z_NO_FLUSH: number;
  Z_PARTIAL_FLUSH: number;
  Z_SYNC_FLUSH: number;
  Z_FULL_FLUSH: number;
  Z_FINISH: number;
  Z_BLOCK: number;
  Z_TREES: number;
  Z_OK: number;
  Z_STREAM_END: number;
  Z_NEED_DICT: number;
  Z_ERRNO: number;
  Z_STREAM_ERROR: number;
  Z_DATA_ERROR: number;
  Z_MEM_ERROR: number;
  Z_BUF_ERROR: number;
  Z_VERSION_ERROR: number;
  Z_NO_COMPRESSION: number;
  Z_BEST_SPEED: number;
  Z_BEST_COMPRESSION: number;
  Z_DEFAULT_COMPRESSION: number;
  Z_FILTERED: number;
  Z_HUFFMAN_ONLY: number;
  Z_RLE: number;
  Z_FIXED: number;
  Z_DEFAULT_STRATEGY: number;
  Z_BINARY: number;
  Z_TEXT: number;
  Z_ASCII: number;
  Z_UNKNOWN: number;
  Z_DEFLATED: number;
  Z_NULL: number;

  ZLIB_VERSION: string;
}

interface ZlibInflate {
  new(options?: ZlibInflateOptions): ZlibInflate;

  readonly windowBits: number;
  readonly chunkSize: number;
  readonly result: Buffer | string | null;
  readonly msg: string | null;
  readonly err: number;

  push(data: Buffer, flush?: boolean | number): void;
}

interface ZlibInflateOptions {
  windowBits?: number;
  chunkSize?: number;
  to?: string;
}

let Zlib: ZlibSyncDefinition | undefined = undefined;
try {
  Zlib = require('zlib-sync');
} catch {
  // noop
}

/**
 * Represents a connection to Discord that deals with emitting gateway events
 *
 * ([**`Discord Docs`**](https://discord.com/developers/docs/topics/gateway#sharding))
 */
export class Shard extends EventBus<ShardEvents> {
  protected _heartbeatInterval?: NodeJS.Timer;
  protected _connectTimeout?: NodeJS.Timeout;
  protected _readyTimeout?: NodeJS.Timeout;

  /**
   * List of unavailable guilds on this [[Shard]] as a set
   * of the guild's IDs
   */
  public unavailableGuilds: Set<string> = new Set();

  /**
   * Timestamp in milliseconds on when we estabished
   * a one to one connection with Discord.
   */
  public connectedAt: number = 0;

  /**
   * The last time we received an acked response
   */
  public lastReceivedAt: number = 0;

  /**
   * The closing sequence of this shard
   */
  public closeSeq: number = -1;

  /**
   * The session ID, this is populated when we receive a HELLO packet from Discord
   */
  public sessionID?: string;

  /**
   * The last time we acked a response
   */
  public lastAckedAt: number = 0;

  /**
   * The resolver function from [WebSocketShard._createConnection]
   */
  private resolver?: () => void;

  /**
   * The rejecter function from [WebSocketShard._createConnection]
   */
  private rejecter?: (error: any) => void;
  private inflate?: ZlibInflate;

  /**
   * The actual end to end connection with Discord
   */
  public socket!: WebSocket | null;

  /**
   * The status of the shard
   */
  public status: keyof typeof ShardStatus = 'Dead';

  /**
   * Checks if this shard is ready to be used
   */
  public ready: boolean = false;

  /**
   * If this [[Shard]] has acked a heartbeat
   */
  public acked: boolean = true;

  /**
   * The sequence number to replaying events
   */
  public seq: number = -1;

  /**
   * This shard's ID
   */
  public id: number;
  #client: WebSocketClient;

  /**
   * Creates a new [[Shard]] instance. Represents a connection to Discord that deals with emitting gateway events.
   * @param client The [[WebSocketClient]] attached to this Shard
   * @param id This shard's ID
   */
  constructor(client: WebSocketClient, id: number) {
    super();

    if (Zlib !== undefined)
      this.inflate = new Zlib.Inflate({
        chunkSize: 65535,
        to: Erlpack === undefined ? 'string' : ''
      });

    this.#client = client;
    this.id = id;
  }

  /**
   * Returns the latency of this shard, returns `-1` if it's
   * still establishing a connection.
   */
  get latency() {
    if (this.status !== 'Connected')
      return -1;

    return this.lastReceivedAt - this.lastAckedAt;
  }

  /**
   * Establishes a new connection with Discord, and connects to the gateway.
   */
  connect() {
    if (this.socket !== null && (this.socket.readyState === WebSocket.OPEN && this.status === 'Connected')) {
      this.debug('We already have a end to end connection!');
      return Promise.resolve(this);
    }

    this.debug(`${this.sessionID !== undefined ? 'Resuming the' : 'Establishing a'} end to end connection...`);
    this.status = 'Handshaking';
    return new Promise<this>((resolve, reject) => void 0);
  }

  /**
   * Disposes this shard and disconnects it from Discord (and possibly re-establish the connection)
   * @param reconnect If this shard should reconnect
   * @param closeCode A close code to use to send to Discord
   */
  dispose(reconnect: boolean = true, closeCode?: number): void { // eslint-disable-line default-param-last
    this.debug(`[DISPOSE] Told to dispose this shard (reconnect=${reconnect}${closeCode !== undefined ? `; close_code=${closeCode}` : ''})`);

    if (this._heartbeatInterval !== undefined)
      clearInterval(this._heartbeatInterval);

    if (this._connectTimeout !== undefined)
      clearTimeout(this._connectTimeout);

    if (this.socket !== null) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(closeCode ?? 1000);
        this.emit('disposed', this.id);
      } else {
        const STATES = Object.keys(WebSocket).slice(0, 4);
        this.debug(`[DISPOSE] Current State: ${STATES[this.socket.readyState]}`);

        this._cleanup();
        try {
          this.socket.close(closeCode ?? 1000);
        } catch {
          // noop
        }

        this.emit('disposed', this.id);
      }
    } else {
      this.emit('disposed', this.id);
    }

    this.socket = null;
    this.status = 'Dead';

    if (this.seq !== -1)
      this.closeSeq = this.seq;

    if (!reconnect) {
      this.sessionID = undefined;
      this.seq = -1;

      this.debug('[DISPOSE] Successfully disposed shard.');
      return;
    } else {
      this.debug('[DISPOSE] Told to reconnect.');
      return void this.#client.shards.connect(this.id);
    }
  }

  /**
   * Sends a packet to Discord
   * @param op The OPCode to use
   * @param data The optional data to use
   */
  send<T = {}>(op: OPCodes, data: T) {
    if (this.socket !== null && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(this.serialize({ op, d: data }));
      this.debug(`-> "${op}: ${Util.getKey(OPCodes, op) ?? 'Unknown'}"`);
    } else {
      this.debug('Connection wasn\'t established.');
    }
  }

  /**
   * Sets the presence for this shard
   * @param status The status to use
   * @param options The options to use
   */
  setActivity(status: OnlineStatus, options: SendActivityOptions) {
    this.send<discord.GatewayPresenceUpdateData>(OPCodes.StatusUpdate, {
      activities: options.activities,
      status: status as discord.PresenceUpdateStatus,
      since: status === 'idle' ? Date.now() : 0,
      afk: !!options.afk
    });
  }

  private debug(message: string) {
    this.emit('debug', this.id, message);
  }

  private deserialize<T = {}>(packet: Buffer | string) {
    return Erlpack !== undefined
      ? Erlpack.unpack<T>(packet as any)
      : JSON.parse(typeof packet === 'string' ? packet : packet.toString('utf-8')) as T;
  }

  private serialize(packet: any): string | Buffer {
    return Erlpack !== undefined
      ? Erlpack.pack(packet)
      : JSON.stringify(packet);
  }

  private serializePacket(data: WebSocket.Data) {
    let d = data;

    try {
      if (typeof d !== 'string') {
        if (data instanceof ArrayBuffer) {
          d = new Uint8Array(data);
        }

        if (Array.isArray(d)) {
          d = Buffer.concat(d);
        }

        if (Zlib !== undefined) {
          const l = (d as any).length;
          const shouldFlush = l >= 4
            && data[l - 4] === 0x00
            && data[l - 3] === 0x00
            && data[l - 2] === 0xff
            && data[l - 1] === 0xff;

          this.inflate?.push(d as any, shouldFlush && Zlib.Z_SYNC_FLUSH);
          if (!shouldFlush)
            return null;

          d = this.inflate!.result as any;
        }
      }

      return this.deserialize<discord.GatewayReceivePayload>(Buffer.isBuffer(d) ? d : d.toString());
    } catch(ex) {
      this.emit('error', this.id, ex);
      return null;
    }
  }

  private _checkReady() {
    if (this._readyTimeout !== undefined)
      clearTimeout(this._readyTimeout);

    if (!this.unavailableGuilds.size) {
      this.debug('Received all guilds from Discord, marking this shard as ready');

      this.status = 'Connected';
      this.ready = true;
      this.emit('ready', this.id);

      delete this._readyTimeout;
      return;
    }

    this._readyTimeout = setTimeout(() => {
      this.debug(`Didn't receive any more guild packets in the last 15 seconds. Marking this shard as ready with ${this.unavailableGuilds.size} unavailable guilds.`);

      delete this._readyTimeout;
      this.status = 'Connected';
      this.ready = true;
      this.emit('ready', this.id, this.unavailableGuilds);
    }, 15000);
  }

  private _identify() {
    this.debug('Identifying a connection...');
    // todo: this
  }

  private _resume() {
    this.debug('Sending resume packet...');
    this.send<discord.GatewayResumeData>(OPCodes.Resume, {
      session_id: this.sessionID!,
      token: this.#client.token,
      seq: this.closeSeq
    });
  }

  private _ackHeartbeat() {
    if (!this.acked) {
      this.debug('Received no heartbeat back');
      return this.dispose(true, 1012);
    }

    this.lastAckedAt = Date.now();
    this.acked = false;

    this.send(OPCodes.Heartbeat, this.seq);
    this.debug('Sent heartbeat to Discord');
  }

  private _cleanup() {
    this
      .socket!
      .off('message', this._onMessage.bind(this))
      .off('close', this._onClose.bind(this))
      .off('error', this._onError.bind(this))
      .on('open', this._onOpen.bind(this));
  }

  private _onOpen() {
    this.debug('Established a connection with Discord');
    this.emit('connect', this.id);

    if (this._connectTimeout !== undefined) {
      clearTimeout(this._connectTimeout);
      delete this._connectTimeout;
    }
  }

  private _onClose(code: number, reason: string) {
    if (this.seq !== -1) this.closeSeq = this.seq;

    if (code) {
      const isClean = code === 1000;
      this.debug(`WebSocket connection has been terminated by Discord ${isClean ? 'cleanly' : 'uncleanly'} for ${reason || '<unknown>'}`);
      let error = new Error(`${code}: ${reason || '<unknown>'}`);

      switch (code) {
        case 4001: {
          error = new Error('Gateway received an invalid OPCode');
        } break;

        case 4002: {
          error = new Error('Gateway received an invalid message');
        } break;

        case 4003: {
          error = new Error('Gateway wasn\'t authenicated');
          this.sessionID = undefined;
        } break;

        case 4004: {
          error = new Error('Authenication failed while logging in');

          this.sessionID = undefined;
          this.emit('error', this.id, new Error(`Invalid token "${this.#client.token}"`));
        } break;

        case 4005: {
          error = new Error('Gateway is already authenicated');
        } break;

        case 4006:
        case 4009: {
          error = new Error('Invalid session');
          this.sessionID = undefined;
        } break;

        case 4007: {
          error = new Error(`Invalid sequence number: ${this.seq}`);
          this.seq = 0;
        } break;

        case 4008: {
          error = new Error('Ratelimited while authenicating/sending packets');
        } break;

        case 4010: {
          error = new Error('Invalid shard');
          this.sessionID = undefined;
        } break;

        case 4011: {
          error = new Error('Shard includes too many guilds (>2500)');
          this.sessionID = undefined;
        } break;

        case 4013: {
          error = new Error('Invalid intents were specified');
          this.sessionID = undefined;
        } break;

        case 4014: {
          error = new Error('Disallowed intents were specified');
          this.sessionID = undefined;
        } break;

        case 1006: {
          error = new Error('Connection was reset');
        } break;
      }

      this.emit('close', this.id, code, error, UnrecoverableCodes.includes(code));
    } else {
      this.debug(`Unknown close code "${code}"`);
    }

    if (code === 4000) {
      this.debug('Received unknown error, reconnecting!');
      const [code, reason] = this.socket!.readyState === WebSocket.OPEN ? [4906, 'Reconnect: Wumpcord'] : [];
      if (!code || !reason)
        this.socket?.terminate();
      else
        this.socket?.close(code, reason);

      this.status = 'Dead';
      setTimeout(() => {
        this.debug('Attempting to re-connect...');
        this.#client.shards.connect(this.id);
      }, 5000);
    }

    const message = UnrecoverableCodes.includes(code) ?
      `Close code "${code}" can't be re-initialized, shard dead.` :
      `Close code "${code}" can be re-initialized, unzombifying...`;

    this.debug(message);
    this.dispose(!UnrecoverableCodes.includes(code));
  }

  private _onError(error: Error) {
    this.emit('error', this.id, error);
  }

  private async _onMessage(packet: WebSocket.Data) {
    const data = this.serializePacket(packet);
    if (data === null) {
      this.emit('error', this.id, new Error('Received nulled data packet, skipping'));
      return;
    }

    this.debug(`<- "${data.op} (${Util.getKey(OPCodes, data.op as number) ?? 'Unknown'})"`);
    if (data.s !== null && data.s > this.seq)
      this.seq = data.s;

    if (data.op === 0)
      this.debug(`[EVENT] Received event "${(data as discord.GatewayDispatchPayload).t}"`);

    switch (data.op as number) {
      case OPCodes.Event: {
        const d = data as discord.GatewayDispatchPayload;
        if (this.status === 'WaitingForGuilds' && d.t === <any> GatewayEvents.GuildCreate) {
          const guild = d.d as discord.GatewayGuildCreateDispatchData;
          this.unavailableGuilds.delete(guild.id);

          // const g = new Guild(this.client, { shard_id: tis.id, ...guild });
          // this.guilds.add(guild.id);
          // this.client.guilds.add(guild.id);

          this._checkReady();
        } else {
          await this.wsEvent(d);
        }
      } break;

      case OPCodes.Heartbeat:
        this._ackHeartbeat();
        break;

      case OPCodes.InvalidSession: {
        this.debug(`[INVALID SESSION] Session ID "${this.sessionID}" is invalid, re-creating...`);

        this.sessionID = undefined;
        this.seq = -1;
        this._identify();
      } break;

      case OPCodes.Reconnect:
        this.debug('[RECONNECT] Discord told us to reconnect.');
        this.dispose(true);
        break;

      case OPCodes.Hello: {
        this.debug('[HELLO] Received first packet.');
        if (this._heartbeatInterval !== undefined) {
          clearTimeout(this._heartbeatInterval);
          delete this._heartbeatInterval;
        }

        const packet = data as discord.GatewayHello;
        this._heartbeatInterval = setInterval(() => this._ackHeartbeat(), packet.d.heartbeat_interval).unref();
        this.status = 'Nearly';

        if (this.sessionID !== undefined) {
          this._ackHeartbeat();
          this._resume();
        } else {
          this._identify();
        }
      } break;

      case OPCodes.HeartbeatAck:
        this.acked = true;
        this.lastReceivedAt = Date.now();
        this.debug(`[HEARTBEAT] Recieved heartbeat ack, latency of ~${this.lastReceivedAt - this.lastAckedAt}ms`);
        break;

      default:
        break; // don't do anything
    }
  }

  private async wsEvent(data: discord.GatewayDispatchPayload) {
    // todo: this
  }
}
