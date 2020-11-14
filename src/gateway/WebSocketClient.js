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

const { User, Guild, BaseChannel, Message } = require('../entities');
const ShardingManager = require('./ShardingManager');
const { Collection }  = require('@augu/immutable');
const Constants       = require('../Constants');
const RESTClient      = require('../rest/RESTClient');
const EventBus        = require('../util/EventBus');
const Util            = require('../util/Util');
const { merge }       = require('../util/Util');
const VoiceRegion     = require('../entities/VoiceRegion');
const { Endpoints }   = require('../Constants');
const GuildMember     = require('../entities/GuildMember');
const Application     = require('../entities/Application');
const Template        = require('../entities/Template');

const ChannelStore = require('../stores/ChannelStore');
const GuildStore = require('../stores/GuildStore');

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
     * Existing voice connections with Discord
     * @type {Collection<import('../voice/VoiceConnection')> | null}
     */
    this.voiceConnections = null;

    /**
     * The last shard ID
     */
    this.lastShardID = 1;

    /**
     * The channels cache or `null` if it's not cachable
     * the bot can see, use `Client#fetchChannel` to get the channel
     * and possibly cache it
     *
     * @type {ChannelStore}
     */
    this.channels = null;

    /**
     * The options that the user defined
     * @type {ClientOptions}
     */
    this.options = merge(opts, {
      populatePresences: false,
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      },
      disabledEvents: [],
      getAllUsers: true,
      shardCount: 'auto',
      strategy: 'json',
      cache: 'none',
      ws: {
        guildSubscriptions: false,
        largeThreshold: 250,
        connectTimeout: 30000,
        clientOptions: undefined,
        compress: false,
        intents: ['guild', 'guildMessages'],
        tries: 5
      }
    });

    /**
     * The guilds cache or `null` if it's not cachable
     * the bot is currently in, use `Client#fetchGuild` to get the guild
     * and possibly cache it
     *
     * @type {GuildStore}
     */
    this.guilds = null;

    /**
     * Any users typing in a channel
     * @type {Collection<UserTyping> | null}
     */
    this.typings = null;

    /**
     * The shard manager
     * @type {ShardingManager}
     */
    this.shards = new ShardingManager(this);

    /**
     * If the bot is ready or not
     * @type {boolean}
     */
    this.ready = false;

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

    this.once('ready', () => {
      if (this.options.getAllUsers) {
        this.emit('debug', 'Now requesting all guild members and possibly caching them...');
        this.requestGuildMembers();
      }
    });
  }

  /**
   * Returns the intents by it's numeric value
   */
  get intents() {
    if (typeof this.options.ws.intents === 'undefined') return Constants.GatewayIntents.guilds | Constants.GatewayIntents.guildMessages;
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
   * Check if the bot has the intent
   * @param {import('../Constants').GatewayIntents} intent The intent to check
   * @returns {boolean} If the bot has it added or not
   */
  hasIntent(intent) {
    return !!(this.intents & Constants.GatewayIntents[intent]);
  }

  /**
   * Connects to the WebSocket service
   */
  async connect() {
    const { url, shards, session, auto } = await this.getShardInfo();

    /**
     * The gateway URL
     * @type {string}
     */
    this.gatewayUrl = `${url}/?v=${Constants.GatewayVersion}&encoding=${this.options.strategy}`;
    if (auto) {
      this.options.shardCount = shards;
      if (this.lastShardID === 1) this.lastShardID = shards === 1 ? 1 : shards - 1;
    } else {
      this.lastShardID = shards;
    }

    this.emit('debug', [
      `[Debug => Auto Sharding]: ${auto}`,
      `[Debug => Session Limit]: ${session ? `${session.remaining}/${session.total}` : 'Not auto sharding'}`,
    ].join('\n'));

    if (this.provider) {
      if (Util.isPromise(this.provider.connect)) await this.provider.connect();
      else this.provider.connect();
    }

    for (let i = 0; i < this.lastShardID; i++) {
      await this.shards.spawn(i, this.options.strategy);
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
        if (this.canCache('channel') && this.channels) this.channels.set(packet.id, packet);
        break;

      case 'guild':
        if (this.canCache('guild') && this.guilds) this.guilds.set(packet.id, packet);
        break;

      case 'user':
        if (this.canCache('user') && this.users) this.users.set(packet.id, packet);
        break;

      default: break;
    }
  }

  /**
   * Retrieves a list of requested guild members
   */
  async requestGuildMembers() {
    if (!this.canCache('guild') || !this.canCache('member')) {
      this.emit('debug', 'Guild cache is disabled, not populating user cache');
      return;
    }

    if (!(this.intents & Constants.GatewayIntents.guildMembers)) {
      this.emit('debug', 'Missing `guildMembers` intent, skipping');
      return;
    }

    /** @type {Promise<Array<Collection<import('../entities/GuildMember')>>>} */
    const promises = this.guilds.map(guild => {
      if (!guild.unavailable) {
        if (this.options.populatePresences && !(this.intents & Constants.GatewayIntents.guildPresences)) {
          this.emit('debug', 'Missing `guildPresences` intent');
          this.options.populatePresences = false;
        }

        return guild.fetchMembers({
          limit: guild.maxMembers,
          presences: this.options.populatePresences,
          query: '',
          time: 120e3,
          nonce: Date.now().toString(16),
          force: false,
          userIds: []
        });
      } else {
        return Promise.resolve(); // resolve it
      }
    });

    await Promise
      .all(promises)
      .then(members => members.map(collection => {
        if (collection.some(member => !this.users.has(member.user.id))) {
          const uncached = collection.filter(member => !this.users.has(member.user.id));
          this.emit('debug', `Received ${uncached.length} uncached members`);

          if (this.canCache('member')) {
            for (let i = 0; i < uncached.length; i++) {
              const member = uncached[i];
              const user = new (require('../entities/User'))(this, member.user);

              this.insert('user', user);
            }
          }
        }
      }));
  }

  /**
   * Disposes this [WebSocketClient]
   */
  dispose() {
    this.emit('debug', 'Reaching EOL status, closing...');

    this.users.cache.clear();
    this.guilds.cache.clear();
    this.channels.cache.clear();

    for (const shard of this.shards.values()) shard.disconnect(false);
    this.emit('debug', 'Disposed, goodbye.');
  }

  /**
   * Gets the list of voice regions
   * @returns {Promise<VoiceRegion[]>} Returns an Array of voice regions
   */
  getVoiceRegions() {
    return this.rest.dispatch({
      endpoint: '/voice/regions',
      method: 'get'
    })
      .then((data) => data.map(region => new VoiceRegion(region)))
      .catch(() => []);
  }

  /**
   * Fetches a user from Discord and caches them, if we can
   * @param {string} id The user's ID
   * @returns {Promise<import('../entities/User')>} The user or `null` if couldn't be fetched
   */
  getUser(id) {
    return this.rest.dispatch({
      endpoint: Endpoints.user(id),
      method: 'GET'
    })
      .then((data) => {
        const user = new User(this, data);

        this.insert('user', user);
        return user;
      })
      .catch(() => null);
  }

  /**
   * Fetches a guild and possibly caches it
   * @param {string} id The user's ID
   * @returns {Promise<import('../entities/Guild')>} The guild or `null` if it couldn't be fetched
   */
  getGuild(id) {
    return this.rest.dispatch({
      endpoint: Endpoints.guild(id, true),
      method: 'GET'
    })
      .then((data) => {
        const guild = new Guild(this, data);

        this.insert('guild', guild);
        return guild;
      });
  }

  /**
   * Fetches a channel and possibly caches it
   * @param {string} id The channel's ID
   * @returns {Promise<import('../entities/BaseChannel')>} The channel or `null` if it couldn't be fetched
   */
  getChannel(id) {
    return this.rest.dispatch({
      endpoint: Endpoints.channel(id),
      method: 'GET'
    })
      .then((data) => {
        const channel = BaseChannel.from(this, data);

        this.insert('channel', channel);
        return channel;
      });
  }

  /**
   * Gets a guild member and possibly caches it in the guild
   * @param {string} guildID The guild's ID
   * @param {string} memberID The member's ID
   * @returns {Promise<import('../entities/GuildMember')>} The member or `null` if not found
   */
  getGuildMember(guildID, memberID) {
    return this.rest.dispatch({
      endpoint: Endpoints.Guild.member(guildID, memberID),
      method: 'GET'
    })
      .then((data) => {
        const member = new GuildMember(this, data);
        if (this.canCache('guild')) {
          const guild = this.guilds.get(guildID);
          if (guild && this.canCache('member')) guild.members.set(member.id, member);
        }

        return member;
      });
  }

  /**
   * Restfully gets a message
   * @param {string} channelID The channel's ID
   * @param {string} messageID The message's ID
   * @returns {Promise<import('../entities/Message') | null>} The message or `null` if not found
   */
  getMessage(channelID, messageID) {
    return this.rest.dispatch({
      endpoint: Endpoints.Channel.message(channelID, messageID),
      method: 'get'
    }).then((data) => new Message(this, data));
  }

  /**
   * Gets the shard information for this [WebSocketClient]
   * @returns {Promise<ShardInfo>}
   */
  async getShardInfo() {
    const data = this.options.shardCount === 'auto'
      ? await this.getBotGateway()
      : await this.getGateway();

    if (!data.hasOwnProperty('url') || (this.options.shardCount === 'auto' && !data.hasOwnProperty('shards')))
      throw new SyntaxError('Unable to fetch data from Discord');

    if (data.url.includes('?')) data.url = data.url.substring(0, data.url.indexOf('?'));

    /** @type {SessionStartLimit | null} */
    const session = data.hasOwnProperty('session_start_limit') ? data.session_start_limit : null;

    if (session !== null && session.remaining <= 0) {
      const error = new Error('You have exceeded the amount of tries to connect to the gateway');
      error.resetAfter = session.reset_after;

      this.emit('error', error);
      return Promise.reject(error);
    }

    return {
      session,
      shards: this.options.shardCount === 'auto' ? data.shards : this.options.shardCount,
      auto: this.options.shardCount === 'auto',
      url: data.url
    };
  }

  /**
   * Returns the shard ID by it's guild
   * @param {string} guildID The guild's ID
   * @returns {number} The shard ID
   */
  getShardByGuildId(guildID) {
    if (!this.ready) throw new Error('Bot hasn\'t initialised yet, [Client.getShardByGuildId] is not available in this context. xwx');

    const id = BigInt(guildID);
    return Number((id >> 22n) % BigInt(this.shards.size));
  }

  /**
   * Returns the OAuth2 application of this [WebSocketClient] or a user's OAuth2 application
   * @returns {Promise<Application>} The application details
   */
  getApplication() {
    return this.rest.dispatch({
      endpoint: '/oauth2/applications/@me',
      method: 'GET'
    }).then((data) => new Application(this, data));
  }

  /**
   * Returns a guild template
   * @param {string} code The code to use
   * @returns {Promise<Template>} The template details
   */
  getGuildTemplate(code) {
    return this.rest.dispatch({
      endpoint: `/guilds/templates/${code}`,
      method: 'GET'
    }).then(data => new Template(this, data));
  }

  toString() {
    const user = this.user ? this.user.tag : '<unknown>';
    return `[WebSocketClient ${user}]`;
  }
};

/**
 * @typedef {object} ClientOptions
 * @prop {boolean} [populatePresences=false] If we should add `presences` when requesting guild members
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
 *
 * @typedef {object} UserTyping
 * @prop {string | import('../entities/User')} user The user's ID or the user instance if cached
 * @prop {string | import('../entities/channel/TextableChannel')} channel The channel's ID or the channel if cached
 * @prop {number} elapsedTime How much time a user typed in this specific channel
 * @prop {Date} lastTimestamp The last timestamp the user has typed in this specific channel
 * @prop {NodeJS.Timeout} timeout The timeout to clear this [UserTyping] instance
 * @prop {Date} since Since the `typingStart` event has been emitted
 *
 * @typedef {object} ShardInfo
 * @prop {SessionStartLimit} [session] The session information, if we called WebSocketClient.getBotGateway
 * @prop {number} shards Number of shards available
 * @prop {boolean} auto If we fetched the shard information automatically
 * @prop {string} url The URL to connect to Discord
 */
