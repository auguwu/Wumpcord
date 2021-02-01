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

import { Guild, GuildMember, SelfUser, User, VoiceChannel } from '../models';
import { VoiceConnectionManager } from '../voice';
import type { Collection } from '@augu/collections';
import type * as discord from 'discord-api-types/v8';
import InteractionHelper from '../interactions/Helper';
import type * as types from '../types';
import * as Constants from '../Constants';
import ShardManager from './ShardingManager';
import RestClient from '../rest/RestClient';
import EventBus, { DefaultEventBusMap } from '../util/EventBus';
import Util from '../util';

import ChannelManager from '../managers/ChannelManager';
import GuildManager from '../managers/GuildManager';
import UserManager from '../managers/UserManager';

import type * as events from '../events';

export interface WebSocketClientEvents extends EntityEvents, DefaultEventBusMap {
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
  ready(unavailable?: Set<string>): void;
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
  messageUpdate(event: events.MessageUpdateEvent): void;
  messageDelete(event: events.MessageDeleteEvent): void;
  message(event: events.MessageCreateEvent): void;

  interactionReceive(event: events.InteractionCreateEvent): void;

  voiceServerUpdate(event: events.VoiceServerUpdateEvent): void;
  voiceStateUpdate(event: events.VoiceStateUpdateEvent): void;

  webhooksUpdate(event: events.WebhooksUpdateEvent): void;
  presenceUpdate(event: events.PresenceUpdateEvent): void;
  typingStart(event: events.TypingStartEvent): void;
  userUpdate(event: events.UserUpdateEvent): void;

  raw(
    type: string,
    data: object // TODO: add safety to this
  ): void;

  rawShard(
    id: number,
    data: object
  ): void;
}

/**
 * Handles everything related to Discord and is the entrypoint to your Discord bot.
 */
export default class WebSocketClient extends EventBus<WebSocketClientEvents> {
  /** List of voice connections available to the client */
  public voiceConnections: VoiceConnectionManager;

  /** The interactions helper, this will return `null` if it's not enabled */
  public interactions: InteractionHelper | null;

  /** The gateway URL to connect all shards to */
  public gatewayURL!: string;

  /** The channel cache available, this will be a empty Collection if not enabled. */
  public channels: ChannelManager;

  /** The client options available to this WebSocket client. */
  public options: types.ClientOptions;

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
  constructor(options: types.NullableClientOptions) {
    super();

    this.voiceConnections = new VoiceConnectionManager(this);
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
    this.shards = new ShardManager(this);
    this.guilds = new GuildManager(this);
    this.users = new UserManager(this);
    this.token = options.token;
    this.rest = new RestClient(this);

    this.once('ready', async () => {
      if (this.options.getAllUsers) {
        this.debug('Get All Users', 'Requesting all guild members...');
        await this.requestGuildMembers();
      }

      if (this.options.interactions) {
        this.debug('Interactions', 'Created interactions helper.');
        this.interactions = new InteractionHelper(this);
      }
    });
  }

  // Private Methods
  debug(title: string, message: string) {
    // @ts-ignore "Argument of type '[string]' is not assignable to parameter of type 'E["debug"] extends Listener ? Parameters<E["debug"]> : any[]'."
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
        for (const member of collection.values()) {
          const user = new User(this, member.user);
          this.users.add(user);
        }
      });
    });
  }

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
    for (const guildID of this.voiceConnections.keys()) this.voiceConnections.leave(guildID);

    this.voiceConnections.clear();
    this.shards.clear();
  }

  setStatus(status: types.OnlineStatus, options: types.SendActivityOptions) {
    for (const shard of this.shards.values()) shard.setStatus(status, options);
  }

  joinVoiceChannel(channelID: string, guildID: string) {
    const channel = this.channels.get<VoiceChannel>(channelID);

    if (!channel)
      return Promise.reject(new TypeError(`Channel "${channelID}" was not cached`));

    if (channel.type !== 'voice')
      return Promise.reject(new TypeError(`Channel "${channelID}" was not a voice channel`));

    if (channel.guild && channel.permissionsOf(this.user.id).has('voiceConnect'))
      return Promise.reject(new TypeError('Misisng `voiceConnect` permission'));

    const guild = this.guilds.get(guildID);
    if (!guild)
      return Promise.reject(new TypeError(`Guild "${guildID}" isn't cached, run GuildStore.fetch to cache it!`));

    return this.voiceConnections.join(guildID, channelID);
  }

  leaveVoiceChannel(guildID: string) {
    this.voiceConnections.leave(guildID);
  }
}
