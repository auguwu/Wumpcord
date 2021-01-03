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

import { GuildMember, SelfUser, User } from '../models';
import type * as discord from 'discord-api-types/v8';
import type * as types from '../types';
import * as Constants from '../Constants';
import { Collection } from '@augu/collections';
import ShardManager from './ShardingManager';
import RestClient from '../rest/RestClient';
import EventBus from '../util/EventBus';
import Util from '../util';

import ChannelManager from '../managers/ChannelManager';
import GuildManager from '../managers/GuildManager';
import UserManager from '../managers/UserManager';

import type * as events from '../events';

interface WebSocketClientEvents extends EntityEvents {
  // Gateway
  shardClose(id: number, error: Error, recoverable: boolean): void;
  shardError(id: number, error: Error): void;
  shardDisconnect(id: number): void;
  shardSpawn(id: number): void;
  shardReady(id: number): void;

  // REST
  restCall(props: types.RestCallProperties): void;
  restUnavailable(): void;
  restEmpty(): void;

  // Normal
  debug(message: string): void;
  error(error: Error): void;
  ready(unavailable: Set<string>): void;
  ready(): void;
}

interface EntityEvents {
  voiceServerUpdate(event: events.VoiceServerUpdateEvent): void;
  voiceStateUpdate(event: events.VoiceStateUpdateEvent): void;

  webhooksUpdate(event: events.WebhooksUpdateEvent): void;
  presenceUpdate(event: events.PresenceUpdateEvent): void;
  typingStart(event: events.TypingStartEvent): void;
  userUpdate(event: events.UserUpdateEvent): void;
}

/**
 * Handles everything related to Discord and is the entrypoint to your Discord bot.
 */
export default class WebSocketClient extends EventBus<WebSocketClientEvents> {
  /** List of voice connections available to the client */
  public voiceConnections: any;

  /** The interactions helper, this will return `null` if it's not enabled */
  public interactions: any;

  /** The gateway URL to connect all shards to */
  public gatewayURL!: string;

  /** The channel cache available, this will be a empty Collection if not enabled. */
  public channels: ChannelManager;

  /** The client options available to this WebSocket client. */
  public options: types.ClientOptions;

  /** The user typing cache if available, this will be a empty Collection if not enabled. */
  public typings: Collection<string, types.UserTyping>;

  /** The guild cache available, this will be a empty Collection if not enabled. */
  public guilds: GuildManager;

  /** The shard manager available to this context. */
  public shards: ShardManager;

  /** If we are ready to be used or not. */
  public ready: boolean = false;

  /** The client's token, this is hidden by default. */
  public token!: string;

  /** The user cache if available, this will be a empty Collection if not enabled. */
  public users: UserManager;

  /** The rest client for creating requests to Discord's REST API. */
  public rest: RestClient;

  /** The self user instance */
  public user!: SelfUser;

  /**
   * Handles everything related to Discord and is the entrypoint to your Discord bot.
   * @param options The options available to this context
   */
  constructor(options: types.NullableClientOptions) {
    super();

    this.voiceConnections = null;
    this.interactions = null;
    this.channels = new ChannelManager(this);
    this.options = Util.merge<types.ClientOptions>(<any> options, {
      populatePresences: false,
      allowedMentions: {
        everyone: false,
        replied: false,
        roles: false,
        users: false
      },
      reconnectTimeout: 7000,
      interactions: false,
      disabledEvents: [],
      getAllUsers: false,
      shardCount: 'auto',
      strategy: 'json',
      cache: 'none',
      token: options.token,
      ws: {
        guildSubscriptions: true,
        largeThreshold: 250,
        connectTimeout: 30000,
        clientOptions: undefined,
        compress: false,
        intents: [],
        tries: undefined
      }
    });
    this.typings = new Collection();
    this.shards = new ShardManager(this);
    this.guilds = new GuildManager(this);
    this.users = new UserManager(this);
    this.rest = new RestClient(this);

    Object.defineProperty(this, 'token', { value: options.token });
    this.once('ready', async () => {
      if (this.options.getAllUsers) {
        this.debug('Get All Users', 'Requesting all guild members...');
        await this.requestGuildMembers();
      }

      if (this.options.interactions) {
        this.debug('Interactions', 'Created interactions helper.');

        this.interactions = new InteractionHelper(this.user.id);
        await this.interactions.getGlobalCommands();
      }
    });
  }

  // Private Methods
  debug(title: string, message: string) {
    this.emit('debug', `[Debug => ${title}] ${message}`);
  }

  /**
   * Connects this [WebSocketClient] to the gateway
   */
  async connect() {
    const shardInfo = await this.getShardInfo();

    this.gatewayURL = `${shardInfo.url}/?v=${Constants.GatewayVersion}&encoding=${this.options.strategy}`;

    if (this.options.shardCount === 'auto')
      this.options.shardCount = shardInfo.shards;

    this.debug('Session Limit', shardInfo.session ? `${shardInfo.session.remaining}/${shardInfo.session.total}` : 'Not auto-sharding.');

    for (let i = 0; i < (this.options.shardCount === 1 ? 1 : this.options.shardCount - 1); i++) {
      await this.shards.spawn(i, this.options.strategy);
      await Util.sleep(5000);
    }
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
   * Returns the bot's gateway information
   */
  getBotGateway() {
    return this.rest.dispatch<discord.APIGatewayBotInfo>({
      endpoint: '/bot/gateway',
      method: 'get'
    });
  }

  /**
   * Returns the gateway information
   */
  getGateway() {
    return this.rest.dispatch<discord.APIGatewayInfo>({
      endpoint: '/gateway',
      method: 'get'
    });
  }

  /**
   * Returns the shard information
   */
  async getShardInfo(): Promise<types.ShardInfo> {
    const data = this.options.shardCount === 'auto' ?
      await this.getBotGateway() :
      await this.getGateway();

    if (!data.url || (this.options.shardCount === 'auto' && !(<any> data).shards))
      throw new TypeError('Unable to retrieve shard information');

    const session: discord.APIGatewaySessionStartLimit | undefined = data.hasOwnProperty('session_start_limit') ? (<any> data).session_start_limit : undefined;
    if (session !== undefined && session.remaining <= 0) {
      const error = new Error('Exceeded the amount of tries to connect');

      this.emit('error', error);
      return Promise.reject(error);
    }

    return {
      session,
      shards: this.options.shardCount === 'auto' ? (<any> data).shards : this.options.shardCount,
      url: data.url
    };
  }

  async requestGuildMembers() {
    if (!(this.intents & Constants.GatewayIntents.guildMembers)) {
      this.debug('Get Guild Members', 'Missing `guildMembers` intent, skipping');
      return;
    }

    const promises = this.guilds.cache.map<Promise<Collection<string, GuildMember> | null>>(guild => {
      if (!guild.unavailable) {
        if (this.options.populatePresences && !(this.intents & Constants.GatewayIntents.guildPresences)) {
          this.debug('Get Guild Members | Populate Presences', 'Missing `guildPresences` intent');
          this.options.populatePresences = false;
        }

        return guild.fetchMembers({
          limit: guild.maxMembers,
          presences: this.options.populatePresences,
          query: '',
          time: 120e3,
          nonce: Date.now().toString(16),
          force: false,
          ids: []
        });
      } else {
        return Promise.resolve(null);
      }
    });

    await Promise.all(promises).then(members => {
      if (members === null) return;

      members.map(collection => {
        if (!collection) return;

        this.debug('Get Guild Members', `Populating ${collection.size} members if possible...`);
        if (this.users.canCache) {
          for (const member of collection.values()) {
            const user = new User(this, member.user);
            this.users.add(user);
          }
        }
      });
    });
  }
}
