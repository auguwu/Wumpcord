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

import { Guild, GuildMember, SelfUser, User } from '../models';
import type { Collection } from '@augu/collections';
import type * as discord from 'discord-api-types/v8';
import type * as types from '../types';
import * as Constants from '../Constants';
import { RestClient } from '../rest/RestClient';
import ShardManager from './ShardingManager';
import { EventBus } from '@augu/utils';
import Util from '../util';

import ChannelManager from '../managers/ChannelManager';
import GuildManager from '../managers/GuildManager';
import UserManager from '../managers/UserManager';

import type * as events from '../events';
import type TextableChannel from '../models/inherit/TextableChannel';
import { MemoryCache } from '../cache/MemoryCache';
import { NoopEntityCache } from '../cache/NoopCache';

const defaultOptions: OmitUndefinedOrNull<Omit<Required<types.ClientOptions>, 'token' | 'cache'>> = {
  sweepUnneededCacheIn: 360000,
  populatePresences: false,
  allowedMentions: {
    everyone: false,
    replied: false,
    roles: false,
    users: false
  },
  reconnectTimeout: 7000,
  disabledEvents: [],
  cacheStrategy: new MemoryCache(),
  getAllUsers: false,
  shardCount: 'auto',
  strategy: 'json',
  intents: [],
  ws: {
    guildSubscriptions: false,
    largeThreshold: 250,
    connectTimeout: 30000,
    clientOptions: undefined,
    compress: false,
    tries: 10
  }
};

export interface WebSocketClientEvents extends EntityEvents {
  // Gateway
  shardClose(id: number, error: Error, recoverable: boolean): void;
  shardError(id: number, error: Error): void;
  shardDisconnect(id: number): void;
  shardSpawn(id: number): void;
  shardReady(id: number, unavailable?: Set<string>): void;

  // REST
  restCall(props: types.RestCallProperties): void;
  restUnavailable(): void;
  restEmpty(): void;

  // Normal
  debug(message: string): void;
  error(error: Error): void;
  ready(): void;
}

interface EntityEvents {
  guildRoleCreate(event: events.GuildRoleCreateEvent): void;
  guildRoleDelete(event: events.GuildRoleDeleteEvent): void;
  guildRoleUpdate(event: events.GuildRoleUpdateEvent): void;

  guildMembersChunk(event: events.GuildMemberChunkEvent): void;
  guildMemberUpdate(event: events.GuildMemberUpdateEvent): void;
  guildMemberRemove(event: events.GuildMemberRemoveEvent): void;
  guildMemberAdd(event: events.GuildMemberAddEvent): void;

  guildBanRemove(event: events.GuildBanRemoveEvent): void;
  guildBanAdd(event: events.GuildBanAddEvent): void;

  guildIntegrationsUpdate(event: events.GuildIntegrationsUpdateEvent): void;
  guildEmojisUpdate(event: events.GuildEmojisUpdateEvent): void;
  guildUnavailable(guild: types.PartialEntity<Guild>): void;
  guildAvailable(guild: Guild): void;
  guildDelete(event: events.GuildDeleteEvent): void;
  guildUpdate(event: events.GuildUpdateEvent): void;
  guildCreate(event: events.GuildCreateEvent): void;

  channelPinsUpdate(event: events.ChannelPinsUpdateEvent): void;
  channelUpdate(event: events.ChannelUpdateEvent): void;
  channelDelete(event: events.ChannelDeleteEvent): void;
  channelCreate(event: events.ChannelCreateEvent): void;

  inviteCreate(event: events.InviteCreateEvent): void;
  inviteDelete(event: events.InviteDeleteEvent): void;

  messageReactionRemoveEmoji(event: events.MessageReactionRemoveEmojiEvent): void;
  messageReactionRemoveAll(event: events.MessageReactionRemoveAllEvent): void;
  messageReactionRemove(event: events.MessageReactionRemoveEvent): void;
  messageReactionAdd(event: events.MessageReactionAddEvent): void;
  messageDeleteBulk(event: events.MessageDeleteBulkEvent<types.AnyChannel>): void;
  messageUpdate(event: events.MessageUpdateEvent<types.AnyChannel>): void;
  messageDelete(event: events.MessageDeleteEvent<types.AnyChannel>): void;
  message(event: events.MessageCreateEvent<types.AnyChannel>): void;

  voiceServerUpdate(event: events.VoiceServerUpdateEvent): void;
  voiceStateUpdate(event: events.VoiceStateUpdateEvent): void;

  webhooksUpdate(event: events.WebhooksUpdateEvent): void;
  presenceUpdate(event: events.PresenceUpdateEvent): void;
  typingStart(event: events.TypingStartEvent): void;
  userUpdate(event: events.UserUpdateEvent): void;
  unknown(id: number, data: object): void;
  rawWS(id: number, data: discord.GatewayReceivePayload): void;
}

/**
 * Handles everything related to Discord and is the entrypoint to your Discord bot.
 * @typeparam Options The WebSocket client options available, must extend [[types.ClientOptions]]
 * @typeparam Events The events to attach to this [[WebSocketClient]], must extend [[WebSocketClientEvents]]
 */
export class WebSocketClient<
  Options extends types.ClientOptions = types.ClientOptions,
  Events extends WebSocketClientEvents = WebSocketClientEvents
> extends EventBus<Events> {
  protected _sweepInterval!: NodeJS.Timer;

  /** The gateway URL to connect all shards to */
  public gatewayURL!: string;

  /** The channel cache available, this will be a empty Collection if not enabled. */
  public channels: ChannelManager;

  /** The client options available to this WebSocket client. */
  public options: Options;

  /** The guild cache available, this will be a empty Collection if not enabled. */
  public guilds: GuildManager;

  /** The shard manager available to this context. */
  public shards: ShardManager;

  /** If we are ready to be used or not. */
  public ready: boolean = false;

  /** The client's token, this is hidden by default. */
  public token: string;

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
  constructor(options: Options) {
    super();

    this.options = Util.merge(<any> options, {
      token: options.token,
      cache: {
        channelMessages: options.cacheStrategy,
        guildPresences: options.cacheStrategy,
        guildMembers: options.cacheStrategy,
        guildEmojis: options.cacheStrategy,
        voiceStates: options.cacheStrategy,
        guilds: options.cacheStrategy,
        roles: options.cacheStrategy,
        users: options.cacheStrategy
      },

      ...defaultOptions
    });

    this.channels = new ChannelManager(this);
    this.shards = new ShardManager(this);
    this.guilds = new GuildManager(this);
    this.users = new UserManager(this);
    this.token = options.token;
    this.rest = new RestClient(this);

    this.on('ready', () => {
      if (this.options.getAllUsers) {
        this.debug('Get All Users', 'Requesting all guild members...');
        this.requestGuildMembers();
      }

      if (this.options.sweepUnneededCacheIn! > 1000 || this.options.sweepUnneededCacheIn! < 8640000) {
        this.debug('Entity Cache Sweep', 'Enabling un-needed cache sweep (use `<1000 or >86400000` to disable it!)');
        this._sweepInterval = setInterval(this._unsweep.bind(this)).unref();
      }
    });
  }

  /**
   * Returns the intents by it's numeric value
   */
  get intents() {
    const intents = this.options.intents!;

    if (typeof intents === 'undefined') return 0;
    else if (typeof intents === 'number') return intents;
    else {
      let bitfield = 0;
      for (let i = 0; i < intents.length; i++) {
        const intent = intents[i];
        if (typeof intent === 'number') {
          bitfield |= intent;
        } else {
          if (!Constants.GatewayIntents.hasOwnProperty(intent)) continue;
          bitfield |= Constants.GatewayIntents[intent];
        }
      }

      return bitfield;
    }
  }

  private _unsweep() {
    for (const channel of this.channels.cache.values()) {
      const isTextable = ['news', 'text', 'dm', 'group'].includes(channel.type);
      if (isTextable) {
        const messages = (channel as TextableChannel<discord.APIChannel>).messages;
        messages.cache.forEach(msg => messages.cache.delete(msg.id));
      }
    }
  }

  debug(title: string, message: string) {
    // @ts-ignore "Argument of type '[string]' is not assignable to parameter of type 'E["debug"] extends Listener ? Parameters<E["debug"]> : any[]'."
    this.emit('debug', `[Debug => ${title}] ${message}`);
  }

  addListener<C extends types.AnyChannel = types.AnyChannel>(event: 'messageDeleteBulk', listener: (event: events.MessageDeleteBulkEvent<C>) => void): this;
  addListener<C extends types.AnyChannel = types.AnyChannel>(event: 'messageDelete', listener: (event: events.MessageDeleteEvent<C>) => void): this;
  addListener<C extends types.AnyChannel = types.AnyChannel>(event: 'messageUpdate', listener: (event: events.MessageUpdateEvent<C>) => void): this;
  addListener<C extends types.AnyChannel = types.AnyChannel>(event: 'message', listener: (event: events.MessageCreateEvent<C>) => void): this;
  addListener<K extends keyof Events>(event: K, listener: Events[K]): this;
  addListener(event: string, listener: (...args: any[]) => void) {
    return super.addListener(event as keyof WebSocketClientEvents, listener);
  }

  on<C extends types.AnyChannel = types.AnyChannel>(event: 'messageDeleteBulk', listener: (event: events.MessageDeleteBulkEvent<C>) => void): this;
  on<C extends types.AnyChannel = types.AnyChannel>(event: 'messageDelete', listener: (event: events.MessageDeleteEvent<C>) => void): this;
  on<C extends types.AnyChannel = types.AnyChannel>(event: 'messageUpdate', listener: (event: events.MessageUpdateEvent<C>) => void): this;
  on<C extends types.AnyChannel = types.AnyChannel>(event: 'message', listener: (event: events.MessageCreateEvent<C>) => void): this;
  on<K extends keyof Events>(event: K, listener: Events[K]): this;
  on(event: string, listener: (...args: any[]) => void) {
    return super.on(event as keyof WebSocketClientEvents, listener);
  }

  once<C extends types.AnyChannel = types.AnyChannel>(event: 'messageDeleteBulk', listener: (event: events.MessageDeleteBulkEvent<C>) => void): this;
  once<C extends types.AnyChannel = types.AnyChannel>(event: 'messageDelete', listener: (event: events.MessageDeleteEvent<C>) => void): this;
  once<C extends types.AnyChannel = types.AnyChannel>(event: 'messageUpdate', listener: (event: events.MessageUpdateEvent<C>) => void): this;
  once<C extends types.AnyChannel = types.AnyChannel>(event: 'message', listener: (event: events.MessageCreateEvent<C>) => void): this;
  once<K extends keyof Events>(event: K, listener: Events[K]): this;
  once(event: string, listener: (...args: any[]) => void) {
    return super.once(event as keyof WebSocketClientEvents, listener);
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

    for (let i = 0; i < (this.options.shardCount === 1 ? 1 : (this.options.shardCount as number) - 1); i++) {
      await this.shards.spawn(i, this.options.strategy!);
      await Util.sleep(5000);
    }
  }

  /**
   * Returns the bot's gateway information
   */
  getBotGateway() {
    return this.rest.dispatch<discord.APIGatewayBotInfo>({
      endpoint: '/gateway/bot',
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
   * Returns shard info for the bot
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

      // @ts-ignore Argument of type '[Error]' is not assignable to parameter of type 'E["error"] extends Listener ? Parameters<E["error"]> : any[]'.
      this.emit('error', error);
      return Promise.reject(error);
    }

    return {
      session,
      shards: this.options.shardCount === 'auto' ? (<any> data).shards : this.options.shardCount,
      url: data.url
    };
  }

  /**
   * Requests all guild members.
   *
   * @remarks
   * This function is O(N) time-complexity. Larger the guilds, larger
   * it takes to calculate.
   */
  async requestGuildMembers() {
    if (!(this.intents & Constants.GatewayIntents.GUILD_MEMBERS)) {
      this.debug('Get Guild Members', 'Missing `guildMembers` intent, skipping');
      return;
    }

    const promises = this.guilds.cache.map<Promise<Collection<string, GuildMember> | null>>(guild => {
      if (!guild.unavailable) {
        if (this.options.populatePresences && !(this.intents & Constants.GatewayIntents.GUILD_PRESENCES)) {
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
        for (const member of collection.values()) {
          const user = new User(this, member.user);
          this.users.add(user);
        }
      });
    });
  }

  /**
   * Disconnects the bot from Discord
   * @param reconnect If we should reconnect all shards again
   */
  disconnect(reconnect: boolean = false) {
    if (reconnect) {
      this.debug('End Of Life', 'Reconnecting all shards to Discord...');
      for (const shard of this.shards.values()) shard.disconnect(true);

      return;
    }

    this.debug('End Of Life', 'Disconnecting from Discord...');
    this.channels.cache.clear();
    this.guilds.cache.clear();
    this.users.cache.clear();

    for (const shard of this.shards.values()) shard.disconnect(false);
    this.shards.clear();
  }

  /**
   * Sets the status of the bot on all shards
   * @param status The online status to use
   * @param options Any additional options to use
   */
  setStatus(status: types.OnlineStatus, options: types.SendActivityOptions) {
    for (const shard of this.shards.values()) shard.setStatus(status, options);
  }
}
