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

const ShardingManager = require('./ShardingManager');
const { Collection }  = require('@augu/immutable');
const Constants       = require('../Constants');
const RESTClient      = require('../rest/RESTClient');
const EventBus        = require('../util/EventBus');
const Util            = require('../util/Util');

/**
 * Represents a client for handling all WebSocket shard connections
 */
module.exports = class WebSocketClient extends EventBus {
  /**
   * Creates a new [WebSocketClient] instance
   * @param {ClientOptions} opts The options to use
   */
  constructor(opts) {
    super();

    /**
     * The last shard ID
     */
    this.lastShardID = 1;

    /**
     * The channels cache or a number representing the number of channels
     * the bot can see, use `Client#fetchChannel` to get the channel
     * and possibly cache it
     * 
     * @type {Collection<import('../entities/BaseChannel')> | number}
     */
    this.channels = 0;

    /**
     * The options that the user defined
     * @type {ClientOptions}
     */
    this.options = {
      disabledEvents: Util.get('disabledEvents', [], opts),
      shardCount: Util.get('shardCount', 'auto', opts),
      strategy: Util.get('strategy', 'json', opts),
      cache: Util.get('cache', 'none', opts),
      ws: Util.get('ws', {
        guildSubscriptions: false,
        largeThreshold: 250,
        connectTimeout: 30000,
        clientOptions: undefined,
        compress: false,
        intents: ['guilds', 'guildMessages'],
        tries: 5
      }, opts)
    };

    /**
     * The guilds cache or a number representing the number of guilds
     * the bot is currently in, use `Client#fetchGuild` to get the guild
     * and possibly cache it
     * 
     * @type {Collection<import('../entities/Guild')> | number}
     */
    this.guilds = 0;

    /**
     * The shard manager
     * @type {ShardingManager}
     */
    this.shards = new ShardingManager(this);

    /**
     * The bot's token
     */
    this.token = opts.token;

    /**
     * The user cache or the number of users the bot can see,
     * if you wanna retrieve information and possibly cache it,
     * you must use `Client#fetchUser/1` function
     * 
     * @type {Collection<import('../entities/User')> | number}
     */
    this.users = 0;

    /**
     * The REST client to use
     * @type {RESTClient}
     */
    this.rest = new RESTClient(this);

    /**
     * The current client user
     * @type {import('../entities/BotUser')}
     */
    this.user = undefined;
  }

  /**
   * Connects to the WebSocket service
   */
  async connect() {
    const data = this.options.shardCount === 'auto' 
      ? await this.getBotGateway().catch(error => this.emit('error', error)) 
      : await this.getGateway().catch(error => this.emit('error', error));

    if (!data.hasOwnProperty('url') || (this.options.shardCount === 'auto' && !data.hasOwnProperty('shards')))
      throw new SyntaxError('Unable to fetch data from Discord');

    if (data.url.includes('?')) data.url = data.url.substring(0, data.url.indexOf('?'));

    /**
     * The gateway URL
     * @type {string}
     */
    this.gatewayUrl = `${data.url}/?v=${Constants.GatewayVersion}&encoding=${this.options.strategy}`;
    if (this.options.shardCount === 'auto') {
      this.options.shardCount = data.shards;
      if (this.lastShardID === 1) this.lastShardID = data.shards === 1 ? 1 : data.shards - 1;
    } else {
      this.lastShardID = this.options.shardCount;
    }

    for (let i = 0; i < this.lastShardID; i++) {
      this.shards.spawn(i, this.options.strategy);
      await Util.sleep(5000);
    }
  }

  /**
   * Creates a request to get the sharded gateway URL
   * @returns {Promise<BotGateway>}
   */
  getBotGateway() {
    return this.rest.dispatch({
      endpoint: '/gateway/bot',
      method: 'get'
    });
  }

  /**
   * Creates a request to get the normal gateway URL
   * @returns {Promise<Gateway>}
   */
  getGateway() {
    return this.rest.dispatch({
      endpoint: '/gateway',
      method: 'get'
    });
  }

  /**
   * Function to check if we can cache `type`
   * @param {import('../Constants').CacheType} type The type to check if we can cache
   * @arity Wumpcord.WebSocketClient.canCache/1
   */
  canCache(type) {
    if (this.options.cache === 'all') return true;
    else if (this.options.cache === 'none') return false;
    else if (Array.isArray(this.options.cache) && this.options.cache.includes(type)) return true;
    else if (this.options.cache === type) return true;
    else return false;
  }

  /**
   * Sets the status for all shards
   * @param {'online' | 'offline' | 'idle' | 'dnd'} status The status to use
   * @param {import('./WebSocketShard').SendActivityOptions} opts The options to use
   */
  setStatus(status, opts) {
    for (const shard of this.shards.values()) shard.setStatus(status, opts);
  }

  /**
   * Adds the entity to the cache
   * @param {'guild' | 'user' | 'channel'} type The entity type
   * @param {any} packet The data packet to add
   */
  insert(type, packet) {
    switch (type) {
      case 'channel':
        if (!this.channels.has(packet.id)) this.canCache('channel') ? this.channels.set(packet.id, packet) : this.channels++;
        return packet;

      case 'guild':
        if (!this.guilds.has(packet.id)) this.canCache('guild') ? this.guilds.set(packet.id, packet) : this.guilds++;
        return packet;

      case 'user':
        if (!this.users.has(packet.id)) this.canCache('user') ? this.users.set(packet.id, packet) : this.users++;
        return packet;

      default: break;
    }
  }
};

/**
 * @typedef {object} ClientOptions
 * @prop {import('./util/Constants').Event[]} [disabledEvents=[]] The disabled events
 * @prop {number | 'auto'} [shardCount='auto'] The shard count
 * @prop {'etf' | 'json'} [strategy='etf'] Strategy when (d)encoding packets
 * @prop {import('../Constants').CacheType | import('../Constants').CacheType[]} [cache='none'] The cache type
 * @prop {WebSocketOptions} [ws=null] The WS options
 * @prop {string} token The token to use
 * 
 * @typedef {object} WebSocketOptions
 * @prop {boolean} [guildSubscriptions=false]
 * @prop {number} [largeThreshold=250]
 * @prop {number} [connectTimeout=30000]
 * @prop {import('ws').ClientOptions} [clientOptions=undefined]
 * @prop {boolean} [compress]
 * @prop {number[] | number} [intents]
 * @prop {number} [tries=5]
 * 
 * @typedef {object} Gateway
 * @prop {string} url The URL
 * 
 * @typedef {object} BotGateway
 * @prop {SessionStartLimit} session_start_limit The start limit
 * @prop {number} shards The number of shards
 * @prop {string} url The URL
 * 
 * @typedef {object} SessionStartLimit
 * @prop {number} reset_after
 * @prop {number} remaining
 * @prop {number} total
 */
