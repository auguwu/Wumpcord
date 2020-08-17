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

const { GatewayEvents, OPCodes, GatewayIntents, GatewayVersion, UnrecoverableCodes } = require('../util/Constants');
const { Collection } = require('@augu/immutable');
const { ClientUser } = require('../entities');
const WebSocket = require('ws');
const EventBus = require('../util/EventBus');

let json = true;
let Erlpack;
try {
  Erlpack = require('erlpack');
  json = false;
} catch {
  // ignore lmao
}

const stringify = json ? JSON.stringify : Erlpack.pack;
const unpack = json ? JSON.parse : Erlpack.unpack;

const Status = {
  Idle: 'idle',
  Zombie: 'zombie',
  Connecting: 'connecting',
  Connected: 'connected',
  Dead: 'dead',
  Nearly: 'nearly',
  WaitingForGuilds: 'waiting'
};

/**
 * Represents a [WebSocketShard] or a class to handle concurrent sessions from Discord
 */
class WebSocketShard extends EventBus {
  /**
   * Creates a new [Shard] instance
   * @param {import('../Client')} client The client
   * @param {ShardOptions} options The options to use
   */
  constructor(client, options) {
    /**
     * Time to reconnect to unzombify this [WebSocketShard]
     */
    this.reconnectTime = 7000; // 7 seconds lol

    /**
     * The strategy to use when encoding/decoding packets
     * @type {'json' | 'etf'}
     * @private
     */
    this.strategy = options.strategy || 'etf'; // opt to etf if it's not defined

    /**
     * The session ID
     * @type {string?}
     */
    this.sessionID = undefined;

    /**
     * Current status of the shard
     * @type {'idle' | 'zombie' | 'connecting' | 'connected' | 'dead' | 'nearly' | 'waiting'}
     */
    this.status = Status.Idle;

    /**
     * Amount of attempts before not re-connecting
     * @type {number}
     */
    this.attempts = 0;

    /**
     * The amount of guilds for this [WebSocketShard]
     * @type {Set<string>}
     */
    this.guilds = new Set();

    /**
     * The client itself
     * @private
     * @type {import('../Client')}
     */
    this.client = client;

    /**
     * The last ping timestamp
     * @type {number}
     */
    this.lastPing = -1;

    /**
     * Current sequence number
     * @type {number}
     */
    this.seq = -1;

    /**
     * The ID of the shard
     * @type {number}
     */
    this.id = options.id;
  }

  /**
   * Create a new connection with this [WebSocketShard]
   * @returns {Promise<void>} Empty promise, nothing new
   */
  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.status === Status.Connected) {
      this.debug('Socket is already connected, not creating a new clone');
      return;
    }

    this.status = Status.Connecting;
    ++this.attempts;
    return this.initialise();
  }

  /**
   * Disconnects this [WebSocketShard]
   * @param {boolean} [reconnect=true] If we should reconnect or not
   */
  disconnect(reconnect = true) {
    if (!this.socket) return;
    if (this._heartbeat) {
      clearInterval(this._heartbeat);
      this._heartbeat = undefined;
    }

    if (this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.removeListener('close', this.onClose.bind(this));
      try {
        if (reconnect && this.sessionID !== null) {
          if (this.socket.readyState === WebSocket.OPEN) this.socket.close(4901, 'Reconnect: Wumpcord');
          else this.socket.terminate();
        } else {
          this.socket.close(1000, 'Reconnect: Wumpcord');
        }
      } catch(ex) {
        this.error(ex);
      }
    }

    this.socket = undefined;
    this.emit('disconnect', this.id);
    this.status = Status.Zombie; // assuming it's a dud connection

    if (this.sessionID && this.client.options.ws.tries >= this.attempts) {
      this.debug(`Tried to validate session again but reached ${this.client.options.ws.tries} tries.`);
      this.sessionID = null;
    }

    if (reconnect && this.attempts < this.client.options.ws.tries) {
      if (this.sessionID) {
        this.debug(`Now connecting to potentially resume un-zombified connection | Attempt #${this.attempts}`);
        this.client.shards.connect(this.id);
      } else {
        this.debug(`Queueing a reconnect to un-zombify this connection | Attempt #${this.attempts}`);
        setTimeout(() => {
          this.debug('Now attempting to un-zombify this connection!');
          this.client.shards.connect(this.id);
        }, this.reconnectTime);

        this.reconnectTime = Math.min(Math.round(this.reconnectTime * (Math.random() * 2 + 1)), 30000);
      }
    } else {
      this.debug('Unable to connect due to not being able to or reached the max amount of tries, now resetting and making this a dud connection');
      this.hardReset();
    }
  }

  /**
   * Sends a packet to Discord
   * @template T The data itself
   * @param {number} op The OPCode to use
   * @param {T} [data] The data
   */
  send(op, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(stringify({ op, d: data }));
      this.debug(`Sent OP ${op} to Discord with strategy ${this.strategy}`);
    } else {
      this.debug(`Unable to send packet with OP ${op} due to connecting not being existant`);
    }
  }

  /**
   * Resets the shard
   */
  hardReset() {
    this._currentPresence = JSON.stringify(this.presence);
    this.sessionID = undefined;
    this.status = Status.Dead;
    this.seq = -1;
  }

  /**
   * Utility to send debug messages
   * @param {string} message The message
   */
  debug(message) {
    this.emit('debug', this.id, message);
  }

  /**
   * Function to send an identify packet
   */
  identify() {
    let intents = 0;
    for (const intent of this.client.options.ws.intents) {
      if (GatewayIntents[intent]) intents |= GatewayIntents[intent];
    }

    const packet = {
      guild_subscriptions: Boolean(this.client.options.ws.guildSubscriptions),
      large_threshold: Number(this.client.options.ws.largeThreshold),
      compress: Boolean(this.client.options.ws.compress),
      intents,
      token: this.client.token,
      v: GatewayVersion,
      properties: {
        $browser: 'Wumpcord',
        $device: 'Wumpcord',
        $os: process.platform
      }
    };

    if (this.client.options.shardCount > 1) packet.shard = [this.id, this.client.options.shardCount];
  }

  /**
   * Establishes a new connection
   */
  initialise() {
    this.debug('Now initialising a new connection...');
    this.socket = new WebSocket(this.client.gatewayUrl, this.client.options.ws.clientOptions);

    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.socket.on('open', this.onOpen.bind(this));

    this._reconnectTimeout = setTimeout(() => {
      this.debug('Didn\'t initialise in the correct amount of time, reconnecting session');
      this.disconnect(true);
    }, this.client.options.ws.reconnectTime);
  }

  /**
   * We have opened a new connection with Disocrd
   */
  onOpen() {
    this.debug('-> New session has been established!');
    this.emit('establish', this.id);

    clearTimeout(this._reconnectTimeout);
  }

  /**
   * Recieves when Discord or we closed ourselves
   * @param {number} code The code to use
   * @param {string} reason The reason to use
   */
  onClose(code, reason) {
    const isRecoverable = UnrecoverableCodes.includes(code);
    if (code) {
      this.debug(`? Connection has closed ${code === 1000 ? 'cleanly' : 'uncleanly'} for ${reason || 'no reason?'}`);
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

      this.emit('close', this.id, error, isRecoverable);
    } else {
      this.debug(`* Unknown close code: ${code}`);
    }

    if (isRecoverable) this.disconnect(true);
    else {
      this.debug('Close code is not recoverable, now exiting process in 5 seconds...');
      setTimeout(() => {
        this.client.cleanup();
        this.hardReset();
        process.exit(1);
      }, 5000);
    }
  }

  /**
   * We have received an error from Discord!
   * @param {Error} error The error
   */
  onError(error) {
    this.emit('error', this.id, error);
  }

  /**
   * We have received a message from Discord, let's see what it is O_o
   * @param {any} packet The packet
   */
  onMessage(packet) {
    const data = unpack(packet);
    this.debug(`?> Received OP ${data.op} from Discord using strategy ${this.strategy}`);

    if (packet.s > this.seq) {
      this.debug(`?> Received new sequence number: ${packet.s}`);
      this.seq = packet.s;
    }

    switch (data.op) {
      case OPCodes.Event: 
        this.onEvent(data);
        break;

      case OPCodes.Heartbeat:
        this.ack();
        break;

      case OPCodes.InvalidSession: {
        this.seq = -1;
        this.sessionID = null;

        this.emit('warn', this.id, 'Invalid session');
        this.identify();
      } break;

      case OPCodes.Reconnect: {
        this.debug('* Discord told us to reconnect');
        this.disconnect(true);
      } break;

      case OPCodes.Hello: {
        this.debug('Recieved HELLO packet!');
        if (data.d.hasOwnProperty('heartbeat_interval') && data.d.heartbeat_interval > 0) {
          if (this._heartbeat) clearInterval(this._heartbeat);
          this._heartbeat = setInterval(this.ack, packet.d.heartbeat_interval);
        }

        this.status = Status.Nearly;
        if (this.sessionID) {
          this.resume();
        } else {
          this.identify();
          this.ack();
        }
      } break;

      case OPCodes.HeartbeatAck: {
        this.acked = true;
        this.lastPing = new Date().getTime();
        this.ping = (this.lastPing - this.lastSent);
      } break;

      default: {
        if (this.status === Status.WaitingForGuilds && packet.t === GatewayEvents.GuildCreate) {
          this.guilds.delete(packet.d.id);
          this.checkReady();
        }
      }
    }
  }

  /**
   * Ack a new heartbeat
   */
  ack() {
    if (this.status === Status.Connecting) return;

    this.lastSent = new Date().getTime();
    this.send(OPCodes.HeartbeatAck, this.seq);
  }

  /**
   * Resumes a new connection
   */
  resume() {
    this.send(OPCodes.Resume, {
      session_id: this.sessionID,
      token: `Bot ${this.client.token}`,
      seq: this.seq
    });
  }

  /**
   * Sets the status of this shard
   * @param {'offline' | 'online' | 'idle' | 'dnd'} status The status itself
   * @param {SendActivityOptions} opts The options
   */
  setStatus(status, opts) {
    this.debug(`?> Setting status to "${status}" with data ${JSON.stringify(opts)}`);
    this.send(OPCodes.StatusUpdate, {
      status,
      since: status === 'idle' ? Date.now() : 0,
      afk: opts.hasOwnProperty('afk') ? opts.afk : false,
      game: {
        name: opts.name,
        type: opts.type,
        url: opts.url
      }
    });
  }

  /**
   * Checks the status
   */
  checkReady() {
    if (!this.guilds.size) {
      this.debug('*> Shard has full guilds, marking as ready');
      this.status = Status.Connected;
      this.emit('ready', this.id);

      return;
    }

    this._readyTimeout = setTimeout(() => {
      this.debug(`?> Shard didn't receive any more guild packets in 15 seconds, ${this.guilds.size.toLocaleString()} unavaliable guilds.`);
      this._readyTimeout = undefined;

      this.emit('ready', this.id, this.guilds);
    });
  }

  /**
   * Received when a new packet has been received (evently)
   * @param {any} data The data
   */
  onEvent(data) {
    this.debug(`-> Received event ${data.t}`);
    switch (data.t) {
      case GatewayEvents.Ready:
      case GatewayEvents.Resumed: {
        this.client.user = new ClientUser(this.client, data.d.user);
        this.sessionID = data.d.session_id;

        if (data.t === GatewayEvents.Resumed) {
          this.ack();
          this.client.emit('resume');
          return;
        }

        // And now the hard part: caching
        // It works in 2 different ways:
        //    1. Collection-based cache (stores in memory)
        //    2. Sets the length of the cache (doesn't store in memory)
        // If the cache type is 'none', we use #2
        // If the cache type is 'all', we use #1
        // If we specified the cache type (by string or array), we use #1 or #2
        if (this.client.options.cacheType === 'none') {
          this.client.channels = 0;
          this.client.guilds   = data.d.guilds.length;
          this.client.users    = 1;
        } else if (this.client.options.cacheType === 'all') {
          this.client.channels = new Collection();
          this.client.guilds   = new Collection();
          this.client.users    = new Collection([this.client.user]);
        } else {
          this.client.channels = this.client.canCache('channel') ? new Collection() : 0;
          this.client.guilds   = this.client.canCache('guild')   ? new Collection() : data.d.guilds.length;
          this.client.users    = this.client.canCache('user')    ? new Collection([this.client.user]) : 1;
        }

        this.guilds = new Set(data.d.guilds.map(s => s.id));
        this.client.emit('ready');
      } break;

      case GatewayEvents.MessageCreated:
        this.client.emit('message', data.d);
        break;
    }
  }
}

module.exports = { WebSocketShard, Status };

/**
 * @typedef {object} ShardOptions
 * @prop {'json' | 'etf'} strategy The strategy to encode/decode packets
 * @prop {number} id The shard's ID
 * 
 * @typedef {object} SendActivityOptions
 * @prop {string} name The name
 * @prop {number} type The type
 * @prop {string} [url] The URL
 * @prop {boolean} [afk] If we are AFK? - what is this
 */