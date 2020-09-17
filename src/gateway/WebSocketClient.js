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
     * The channels cache or `null` if it's not cachable
     * the bot can see, use `Client#fetchChannel` to get the channel
     * and possibly cache it
     * 
     * @type {Collection<import('../entities/BaseChannel')> | null}
     */
    this.channels = null;

    /**
     * The options that the user defined
     * @type {ClientOptions}
     */
    this.options = {
      allowedMentions: Util.get('allowedMentions', {
        everyone: false,
        roles: false,
        users: false
      }, opts),
      disabledEvents: Util.get('disabledEvents', [], opts),
      getAllUsers: Util.get('getAllUsers', true, opts),
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
     * The guilds cache or `null` if it's not cachable
     * the bot is currently in, use `Client#fetchGuild` to get the guild
     * and possibly cache it
     * 
     * @type {Collection<import('../entities/Guild')> | null}
     */
    this.guilds = null;

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
     * The user cache or or `null` if it's not cachable,
     * if you wanna retrieve information and possibly cache it,
     * you must use `Client#fetchUser/1` function
     * 
     * @type {Collection<import('../entities/User')> | null}
     */
    this.users = null;

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

    this.once('ready', () => this.requestGuildMembers.call(this));
  }

  /**
   * Returns the intents by it's numeric value
   */
  get intents() {
    if (typeof this.options.ws.intents === 'undefined') return Constants.GatewayIntents.guilds | Constants.GatewayIntents.guildMessages | Constants.GatewayIntents.guildMembers;
    else if (typeof this.options.ws.intents === 'number') return this.options.ws.intents;
    else {
      let intents = 0;
      for (let i = 0; i < this.options.ws.intents.length; i++) {
        const intent = this.options.ws.intents[i];
        if (typeof intent === 'number') {
          intents |= intent;
        } else {
          if (!Constants.GatewayIntents.hasOwnProperty(intent)) continue;
          intents |= Constants.GatewayIntents[intent];
        }
      }

      return intents;
    }
  }

  /**
   * Connects to the WebSocket service
   */
  async connect() {
    const data = this.options.shardCount === 'auto' 
      ? await this.getBotGateway()
      : await this.getGateway();

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
        if (!this.channels.has(packet.id)) this.canCache('channel') ? this.channels.set(packet.id, packet) : void 0;
        break;

      case 'guild':
        if (!this.guilds.has(packet.id)) this.canCache('guild') ? this.guilds.set(packet.id, packet) : void 0;
        break;

      case 'user':
        if (!this.users.has(packet.id)) this.canCache('user') ? this.users.set(packet.id, packet) : void 0;
        break;

      default: break;
    }
  }

  /**
   * Retrieves a list of requested guild members
   */
  async requestGuildMembers() {
    this.emit('debug', 'Now requesting all guild members and possibly caching them...');
        
    if (!this.canCache('guild') || !this.canCache('member')) {
      this.emit('debug', 'Guild cache is disabled, not populating user cache');
      return;
    }

    if (!(this.intents & Constants.GatewayIntents.guildMembers)) {
      this.emit('debug', 'Missing `guildMembers` intent, skipping');
      return;
    }

    const promises = this.guilds.map(guild => {
      if (!guild.unavailable) return guild.fetchMembers();
      else return Promise.resolve();
    });

    await Promise
      .all(promises)
      .then(members => members.map(collection => {
        if (collection.some(member => !this.users.has(member.user.id))) {
          const uncached = collection.filter(member => !this.users.has(member.user.id));
          this.emit('debug', `Received ${uncached.length} uncached members`);

          if (this.canCache('member')) {
            this.emit('debug', 'We can cache members, now populating...');
            for (let i = 0; i < uncached.length; i++) {
              const member = uncached[i];
              const user = new (require('../entities/User'))(this, member.user);

              this.insert('user', user);
            }
          }
        }
      }));
  }

  toString() {
    const user = this.user ? this.user.tag : '<unknown>';
    return `[WebSocketClient ${user}]`;
  }
};

/**
 * @typedef {object} ClientOptions
 * @prop {boolean} [getAllUsers=true] If we should call WebSocketClient#requestGuildMembers on all guilds and populate cache
 * @prop {AllowedMentions} [allowedMentions] Object of allowed mentions
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
 * 
 * @typedef {object} AllowedMentions
 * @prop {boolean} [everyone] If we should allow the bot to ping everyone
 * @prop {boolean | string[]} [roles] Boolean value of `true` if we should parse every role as a mentionable ping or an Array of role ids
 * @prop {boolean | string[]} [users] Boolean value of `true` if we should parse every user as a mentionable ping or an Array of user ids
 */
