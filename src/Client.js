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

const { GatewayVersion } = require('./util/Constants');
const { Collection } = require('@augu/immutable');
const ShardManager = require('./gateway/ShardManager');
const RESTClient = require('./rest/RESTClient');
const EventBus = require('./util/EventBus');

/**
 * Checks if a property exists in an object, returns a default value if none was provided
 * 
 * @template U The default value
 * @template O The options
 * @param {keyof O} prop The property to find
 * @param {U} defaultValue The default value if not found
 * @param {O} [options] The options itself
 * @returns {U} The value itself
 */
const getOption = (key, defaultValue, options) => {
  if (options === undefined || options === null) return defaultValue;
  else if (options.hasOwnProperty(key)) return options[key];
  else return defaultValue;
};

/**
 * Returns a [Client] instance, which is basically an entrypoint class for
 * normal and sharded clients for Discord bots
 */
module.exports = class Client extends EventBus {
  /**
   * Creates a new [Client] instance
   * @prop {string} token The token
   * @param {NulledClientOptions} opts The options to use
   */
  constructor(token, opts) {
    super();

    /**
     * The first shard ID
     * @type {number}
     */
    this.firstShardID = 0;

    /**
     * The last shard ID
     * @type {number}
     */
    this.lastShardID = 1;

    /**
     * The channels cache
     * @type {Collection<import('./entities/BaseChannel')> | number}
     */
    this.channels = 0;

    /**
     * The client's options
     * @type {ClientOptions}
     */
    this.options = Object.assign({
      disabledEvents: [],
      shardCount: 'auto',
      strategy: 'etf',
      cache: 'none',
      ws: {
        guildSubscriptions: false,
        largeThreshold: 250,
        connectTimeout: 30000,
        clientOptions: undefined,
        compress: false,
        intents: [],
        tries: 5
      }
    }, opts);

    /**
     * The guilds cache
     * @type {Collection<import('./entities/BaseGuild')> | number}
     */
    this.guilds = 0;

    /**
     * Shard cache
     * @type {ShardManager}
     */
    this.shards = new ShardManager(this);

    /**
     * The user cache
     * @type {Collection<import('./entities/User')> | number}
     */
    this.users = 0;

    /**
     * The bot user
     * @type {import('./entities/BotUser')}
     */
    this.user = undefined;

    /**
     * Rest client
     * @type {RESTClient}
     */
    this.rest = new RESTClient(this);

    /**
     * The token (can't be inspected)
     * @type {string}
     */
    Object.defineProperty(this, 'token', { value: token });
  }

  /**
   * Establishes a new connection
   */
  async connect() {
    const gateway = this.options.shardCount === 'auto' ? await this.getBotGateway() : await this.getNormalGateway();
    if (
      !gateway.hasOwnProperty('url') ||
      (this.options.shardCount === 'auto' && !gateway.hasOwnProperty('shards'))
    ) throw new Error('Unable to fetch data from Discord');

    if (gateway.url.includes('?')) gateway.url = gateway.url.substring(0, gateway.url.indexOf('?'));

    /**
     * The gateway URL
     * @type {string}
     */
    this.gatewayUrl = `${gateway.url}/?v=${GatewayVersion}&encoding=${this.options.strategy}`;
    if (this.options.shardCount === 'auto') {
      this.options.shardCount = data.shards;
      if (this.lastShardID === 1) this.lastShardID = data.shards - 1;
    }

    for (let i = 0; i < this.lastShardID; i++) {
      this.shards.spawn(i, this.options.strategy);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  /**
   * Gets the gateway for a sharded client
   * @returns {Promise<BotGateway>} The data fetched
   */
  getBotGateway() {
    return this.rest.dispatch({
      endpoint: '/bot/gateway',
      method: 'GET'
    });
  }

  /**
   * Gets the normal gateway URl
   * @returns {Promise<Gateway>} The data fetched
   */
  getNormalGateway() {
    return this.rest.dispatch({
      endpoint: '/gateway',
      method: 'GET'
    });
  }

  /**
   * If we can cache by `type`
   * @param {import('./util/Constants').CacheType} type The cache type
   */
  canCache(type) {
    if (this.options.cache === 'all') return true;
    else if (this.options.cache === 'none') return false;
    else if (Array.isArray(this.options.cache) && this.options.cache.includes(type)) return true;
    else if (this.options.cache === type) return true;
    else return false;
  }
};

/**
 * @typedef {object} ClientOptions
 * @prop {import('./util/Constants').Event[]} [disabledEvents=[]] The disabled events
 * @prop {number | 'auto'} [shardCount='auto'] The shard count
 * @prop {'etf' | 'json'} [strategy='etf'] Strategy when (d)encoding packets
 * @prop {import('./util/Constants').CacheType} [cache='none'] The cache type
 * @prop {WebSocketOptions} [ws=null] The WS options
 * 
 * @typedef {object} WebSocketOptions
 * @prop {boolean} [guildSubscriptions=false]
 * @prop {number} [largeThreshold=250]
 * @prop {number} [connectTimeout=30000]
 * @prop {import('ws').ClientOptions} [clientOptions=undefined]
 * @prop {boolean} [compress]
 * @prop {import('./util/Constants').GatewayIntents[] | number} [intents]
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