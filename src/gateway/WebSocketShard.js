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

const { Collection } = require('@augu/immutable');
const GatewayEvents  = require('./events');
const Constants      = require('../Constants');
const WebSocket      = require('ws');
const { Guild }      = require('../entities');
const EventBus       = require('../util/EventBus');
const Util           = require('../util/Util');

/** @type {typeof import('erlpack') | undefined} */
let Erlpack = undefined;

try {
  Erlpack = require('erlpack');
} catch(ex) {
  // ignore lol
}

/**
 * Represents a [WebSocketShard] instance, which creates a new
 * connection to Discord and connects to it's WebSocket service
 * and this is the service for handling events Discord -> Us
 */
module.exports = class WebSocketShard extends EventBus {
  /**
   * Creates a new [WebSocketShard] class
   * @param {import('./WebSocketClient')} client The client
   * @param {WebSocketShardOptions} options The options to use
   */
  constructor(client, options) {
    super();

    /**
     * The reconnect time to re-connect if a connection is zombified
     * @type {number}
     */
    this.reconnectTime = Util.get('reconnectTimeout', 7000, options);

    /**
     * List of unavailable guilds
     * @type {Set<string>}
     */
    this.unavailableGuilds = new Set();

    /**
     * The session ID
     * @type {?string}
     */
    this.sessionID = undefined;

    /**
     * The strategy to use when encoding/decoding packets from Discord
     * @type {'etf' | 'json'}
     */
    this.strategy = Util.get('strategy', 'etf', options);

    /**
     * The attempts when reconnecting
     * @type {number}
     */
    this.attempts = 0;

    /**
     * The status of the shard
     * @type {number}
     */
    this.status = Constants.ShardStatus.Zombie;

    /**
     * The client
     * @private
     * @type {import('./WebSocketClient')}
     */
    this.client = client;

    /**
     * Collection or a number of the guilds for this shard
     */
    this.guilds = client.canCache('guild') ? new Collection() : 0;

    /**
     * The sequence number
     */
    this.seq = -1;

    /**
     * The ID of the shard
     * @type {number}
     */
    this.id = options.id;
  }

  /**
   * Returns the shard's latency
   */
  get ping() {
    return (this.lastReceived - this.lastSent) || -1;
  }

  /**
   * Returns the strategy to pack data
   */
  get pack() {
    return this.strategy === 'etf' ? Erlpack.pack : JSON.stringify;
  }

  /**
   * Returns the strategy to unpack data
   */
  get unpack() {
    return this.strategy === 'etf' ? Erlpack.unpack : JSON.parse;
  }

  /**
   * Connects to the WebSocket service
   */
  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.status === Constants.ShardStatus.Connected) {
      this.debug('Service is already connecting, not creating a new instance...');
      return;
    }

    this.status = Constants.ShardStatus.Connecting;
    this.attempts++;
    this.initialise();
  }

  /**
   * Disconnects from the service, making this [WebSocketShard] a zombified connection
   * @param {boolean} [reconnect=true] If we should reconnect back or not
   * @arity Wumpcord.Sharding.WebSocketShard.disconnect/1
   */
  disconnect(reconnect = true) {
    if (!this.socket) return;
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = undefined;
    }

    if (this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.removeListener('close', this.onClose.bind(this));
      try {
        if (reconnect && this.sessionID !== undefined) {
          if (this.socket.readyState === WebSocket.OPEN) this.socket.close(4901, 'Reconnect: Wumpcord');
          else this.socket.terminate();
        } else {
          this.socket.close(1000, 'Reconnect: Wumpcord');
        }
      } catch(ex) {
        this.error(ex);
      }
    }

    this.status = Constants.ShardStatus.Zombie;
    this.socket = undefined;
    this.emit('disconnect', this.id);

    if (this.sessionID !== undefined && this.client.options.ws.tries < this.attempts) {
      this.debug(`Reached the max threshold (${this.client.options.ws.tries}) to validate session`);
      this.sessionID = undefined;
    }

    if (reconnect) {
      if (this.sessionID !== undefined) {
        this.debug(`Connecting to potentially resume zombified connection (${this.attempts}/${this.client.options.ws.tries})`);
        this.client.shards.connect(this.id);
      } else {
        this.debug(`Now attempting to un-zombify this connection (${this.attempts}/${this.client.options.ws.tries})`);
        setTimeout(() => {
          this.debug('Attempting to un-zombify connection...');
          this.client.shards.connect(this.id);
        }, this.reconnectTime);

        this.reconnectTime = Math.min(Math.round(this.reconnectTime * (Math.random() * 2 + 1)), 30000);
      }
    } else {
      this.debug('Shard has reached it\'s life, resetting');
      this.hardReset();
    }
  }

  /**
   * Sends a packet to Discord
   * @template T The data structure
   * @param {number} op The OPCode to send
   * @param {T} [data] The data to send
   * @arity Wumpcord.Sharding.WebSocketShard.send/2
   */
  send(op, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(this.pack({ op, d: data }));
      this.debug(`Sent OPCode "${op}" to Discord with strategy ${this.strategy}`);
    } else {
      this.debug('Connection is non-existent, not sending data');
    }
  }

  /**
   * Hard resets this [WebSocketShard] instance
   */
  hardReset() {
    this._presence = JSON.stringify(this.presence);
    this.sessionID = undefined;
    this.status = Constants.ShardStatus.Dead;
    this.seq = -1;
  }

  /**
   * Sends a debug message to the emitter
   * @param {string} message The message to send
   * @arity Wumpcord.Sharding.WebSocketShard.debug/1
   */
  debug(message) {
    this.emit('debug', this.id, message);
  }

  /**
   * Sends a error message to the emitter
   * @param {string} message The message to send
   * @arity Wumpcord.Sharding.WebSocketShard.error/1
   */
  error(message) {
    this.emit('error', this.id, message);
  }

  /**
   * Sends an IDENTIFY packet to Discord
   */
  identify() {
    this.debug('Now identifying with Discord...');
    let intents = 0;
    if (Array.isArray(this.client.options.ws.intents)) {
      for (const intent of this.client.options.ws.intents) {
        if (typeof intent === 'number') intents |= intent;
        if (Constants.GatewayIntents[intent]) intents |= Constants.GatewayIntents[intent];
      }
    } else {
      intents = this.client.options.ws.intents;
    }

    const packet = {
      guild_subscriptions: Boolean(this.client.options.ws.guildSubscriptions),
      large_threshold: Boolean(this.client.options.ws.largeThreshold),
      compress: false, // TODO: add compression
      intents,
      token: this.client.token,
      v: Constants.GatewayVersion,
      properties: {
        $browser: 'Wumpcord',
        $device: 'Wumpcord',
        $os: process.platform
      }
    };

    if (this.client.options.shardCount > 1) packet.shard = [this.id, this.client.options.shardCount];
    this.send(Constants.OPCodes.Identify, packet);
  }

  /**
   * Initialises a new [WebSocketShard] instance
   */
  initialise() {
    this.debug('Now creating a new connection...');

    this.socket = new WebSocket(this.client.gatewayUrl, this.client.options.ws.clientOptions);
    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.socket.on('open', this.onOpen.bind(this));

    this._reconnectTimeout = setTimeout(() => {
      this.debug('Didn\'t initialise a new session in the correct time, reconnecting...');
      this.disconnect(true);
    }, this.reconnectTime);
  }

  onOpen() {
    this.debug('New session has been established');
    this.emit('establish', this.id);

    clearTimeout(this._reconnectTimeout);
  }

  /**
   * Received when the shard has closed it's connection
   * @param {number} code The code
   * @param {string} reason The reason
   * @arity Wumpcord.Sharding.WebSocketShard.onClose/2
   */
  onClose(code, reason) {
    if (code) {
      this.debug(`Connection has closed ${code === 1000 ? 'cleanly' : 'uncleanly'} for ${reason || 'no reason?'}`);
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
          error = new Error(`Invalid sequence number: ${this.seq}`);
          this.seq = 0;
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

      this.emit('close', this.id, error, Constants.UnrecoverableCodes.includes(code));
    } else {
      this.debug(`Unknown close code: ${code}`);
    }

    if (Constants.UnrecoverableCodes.includes(code)) {
      this.debug(`Code "${code}" is un-recoverable, exiting process`);
      setTimeout(() => {
        this.hardReset();
        this.disconnect(false);

        process.exit(1);
      });
    } else {
      this.debug(`Code "${code}" is recoverable, restarting shard`);
      this.disconnect(true);
    }
  }

  /**
   * Received when an error occurs
   * @param {Error} error The error
   */
  onError(error) {
    this.error(error);
  }

  /**
   * Received when a message has been sent from Discord
   * @param {any} packet The packet to receive
   * @arity Wumpcord.Sharding.WebSocketShard.onMessage/1
   */
  onMessage(packet) {
    const data = this.getDataPacket(packet);
    if (data === null) {
      this.error('Received nullified data packet, didn\'t go to plan.');
      return;
    }

    this.debug(`Received OP ${data.op} from Discord using strategy ${this.strategy}`);
    if (data.s !== null && data.s > this.seq) {
      this.debug(`Received new sequence number: ${data.s}`);
      this.seq = data.s;
    }

    switch (data.op) {
      case Constants.OPCodes.Event: {
        if (this.status === Constants.ShardStatus.WaitingForGuilds && data.t === Constants.GatewayEvents.GuildCreate) {
          this.unavailableGuilds.delete(data.d.id);
          if (this.client.canCache('guild')) {
            const packet = new Guild(this.client, data.d);

            this.guilds.set(packet.id, packet);
            this.client.insert('guild', packet);
          } else {
            this.guilds++;
            this.client.guilds++;
          }

          this.checkReady();
        } else {
          if (GatewayEvents.hasOwnProperty(data.t)) return GatewayEvents[data.t].call(this, data);
          this.emit('event', this.id, data);
        }
      } break;

      case Constants.OPCodes.Heartbeat:
        this.sendHeartbeat();
        break;

      case Constants.OPCodes.InvalidSession: {
        this.seq = -1;
        this.sessionID = undefined;

        this.emit('warn', this.id, 'Invalid session, re-identifying');
        this.identify();
      } break;

      case Constants.OPCodes.Reconnect:
        this.debug('Discord told us to reconnect');
        this.disconnect(true);
        break;

      case Constants.OPCodes.Hello: {
        this.debug('Received HELLO packet!');
        if (data.d.hasOwnProperty('heartbeat_interval') && data.d.heartbeat_interval > 0) {
          if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);

          this._heartbeatInterval = setTimeout(() => this.sendHeartbeat(), data.d.heartbeat_interval);
        }

        this.status = Constants.ShardStatus.Nearly;
        this.sessionID ? this.resume() : this.identify();
      } break;

      case Constants.OPCodes.HeartbeatAck: {
        this.lastReceived = new Date().getTime();
        this.debug('Received heartbeat back! Connection is stable.');
      } break;

      default: {
        if (this.status === Constants.ShardStatus.WaitingForGuilds && data.t === Constants.GatewayEvents.GuildCreate) {
          this.unavailableGuilds.delete(data.d.id);
          if (this.client.canCache('guild')) {
            this.guilds.set(data.d.id, new Guild(this.client, { shard_id: this.id, ...data.d }));
            this.client.insert('guild', new Guild(this.client, { shard_id: this.id, ...data.d }));
          }

          this.checkReady();
        } else {
          this.emit('event', this.id, data);
        }
      } break;
    }
  }

  /**
   * Sends a heartbeat to Discord
   */
  sendHeartbeat() {
    if (this.status !== Constants.ShardStatus.Connected) return;

    this.lastSent = new Date().getTime();
    this.send(Constants.OPCodes.Heartbeat, this.seq);
    this.debug('Sent heartbeat to Discord');
  }

  /**
   * Resumes it's connection
   */
  resume() {
    this.send(Constants.OPCodes.Resume, {
      session_id: this.sessionID,
      token: `Bot ${this.client.token}`,
      seq: this.seq
    });
  }

  /**
   * Sets the status of this [WebSocketShard]
   * @param {'online' | 'offline' | 'idle' | 'dnd'} status The status to set as
   * @param {SendActivityOptions} opts The options
   */
  setStatus(status, opts) {
    this.send(Constants.OPCodes.StatusUpdate, {
      status,
      since: status === 'idle' ? Date.now() : 0,
      afk: Util.get('afk', false, opts),
      game: {
        name: opts.name,
        type: opts.type,
        url: opts.url
      }
    });
  }

  /**
   * Checks the status of this [WebSocketShard] instance
   */
  checkReady() {
    if (this._readyTimeout) clearTimeout(this._readyTimeout);
    if (!this.unavailableGuilds.size) {
      this.debug('Recieved all guilds from Discord, marking it as ready!');

      this.status = Constants.ShardStatus.Connected;
      this.emit('ready', this.id);

      if (this.client.shards.size !== this.client.options.shardCount || this.client.shards.some(s => s.status !== Constants.ShardStatus.Connected)) {
        return;
      } else {
        this.client.ready = true;
        this.client.emit('ready');
        return;
      }
    }

    this._readyTimeout = setTimeout(() => {
      this.debug(`Didn't received any more guild packets in the last 15 seconds, ${this.unavailableGuilds.size} unavailable guilds.`);
      this._readyTimeout = undefined;

      this.status = Constants.ShardStatus.Connected;
      this.emit('ready', this.id, this.unavailableGuilds);

      this.client.ready = true;
      this.client.emit('ready');
    }, 15000);
  }

  /**
   * Gets the data packet structure
   * @param {WebSocket.Data} data The data to get
   */
  getDataPacket(data) {
    let packet;
    try {
      if (data instanceof ArrayBuffer) {
        if (Erlpack) packet = Buffer.from(data);
      } else if (Array.isArray(data)) {
        packet = Buffer.concat(data);
      }

      packet = this.unpack(Buffer.isBuffer(data) ? data : data.toString());
    } catch(ex) {
      this.error(ex);
      packet = null;
    }

    return packet;
  }

  toString() {
    return `[WebSocketShard #${this.id}/${this.client.shards.size}]`;
  }
};

/**
 * @typedef {object} WebSocketShardOptions
 * @prop {'json' | 'etf'} strategy The strategy to encode/decode packets
 * @prop {number} id The shard's ID
 *
 * @typedef {object} SendActivityOptions
 * @prop {string} name The name
 * @prop {number} type The type
 * @prop {string} [url] The URL
 * @prop {boolean} [afk] If we are AFK? - what is this
 */
