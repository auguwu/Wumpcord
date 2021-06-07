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

/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable camelcase */

import { RestClientEvents as IRestClientEvents, RestClient } from '@wumpcord/rest';
import type { ShardEvents as IShardEvents } from './gateway/Shard';
import { EventBus, sleep } from '@augu/utils';
import type * as discord from 'discord-api-types';
import { ShardManager } from './gateway/ShardManager';
import type * as types from './types';

import { ChannelStore } from './stores/ChannelStore';
import { GatewayIntents, GatewayVersion, StageInstancePrivacyLevel } from './Constants';
import { InteractionCommandBuilder } from './builders/InteractionCommandBuilder';
import { Application } from './entities/Application';
import { SelfUser } from './entities';
import { UserStore } from './stores/UserStore';
import { APIStageInstance, StageInstance } from './entities/StageInstance';
import Util from './util';
import type { ButtonClickContext } from './gateway/events';
import { GuildStore } from './stores/GuildStore';

type RestClientEvents = {
  [P in keyof IRestClientEvents as `rest${Capitalize<P>}`]: IRestClientEvents[P];
};

type ShardEvents = {
  [P in keyof IShardEvents as `shard${Capitalize<P>}`]: IShardEvents[P];
}

/**
 * List of events related to any entity from the dispatch event.
 */
export interface EntityBasedEvents {
  /**
   * Emitted when the bot has received a slash command interaction
   * in a guild.
   *
   * @param data The guild interaction message
   */
  receiveGuildInteraction(data: null): void;

  /**
   * Emitted when the bot has received a slash command interaction
   * in DMs.
   *
   * @param data The DM interaction message
   */
  receiveDMInteraction(data: null): void;

  /**
   * Emitted when a button was clicked from a message
   * @param context The context of the button click
   */
  buttonClick(context: ButtonClickContext): void;
}

/**
 * Options object for [[WebSocketClient.editStageInstance]]
 *
 * [`Discord Docs`]({@link https://discord.com/developers/docs/resources/stage-instance#update-stage-instance-json-params})
 */
export interface ModifyStageInstance {
  privacy_level?: StageInstancePrivacyLevel;
  topic?: string;
}

/**
 * https://discord.com/developers/docs/resources/stage-instance#create-stage-instance-json-params
 */
export interface CreateStageInstance {
  privacy_level?: StageInstancePrivacyLevel;
  channel_id: string;
  topic: string;
}

/**
 * Represents the default events that can emit with the attached [[WebSocketClient]].
 */
export interface WebSocketClientEvents extends EntityBasedEvents, RestClientEvents, ShardEvents {
  /**
   * Emitted when any debug events happens in this [[WebSocketClient]]
   * @param message The message that is sent
   */
  debug(message: string): void;

  /**
   * Emitted when any errors occur
   * @param error The error
   */
  error(error: Error): void;

  /**
   * Emitted when all shards are ready
   */
  ready(): void;
}

const defaults: Omit<types.ClientOptions, 'token'> = {
  sweepUnneededCacheIn: 360_000,
  populatePresences: false,
  allowedMentions: {
    everyone: false,
    replied: false,
    roles: false,
    users: false
  },
  getAllUsers: false,
  shardCount: 'auto',
  intents: [],
  ws: {
    largeThreshold: 250,
    connectTimeout: 25000,
    clientOptions: undefined,
    compress: false
  }
};

/**
 * Defines a "WebSocketClient", where this is your main entrypoint
 * of running your Discord bot! ✧･ﾟ: \*✧･ﾟ:\*(\*❦ω❦)\*:･ﾟ✧*:･ﾟ✧
 *
 * @example
 * ```js
 * const { Client } = require('wumpcord');
 * const client = new Client({ token: '<token>', intents: ['GUILD_MESSAGES'] });
 *
 * client.on('message', msg => {
 *    if (msg.content === '!ping') return msg.channel.send('Pong!');
 * });
 *
 * client.connect();
 * ```
 */
export class WebSocketClient extends EventBus<WebSocketClientEvents> {
  protected _sweepInterval?: NodeJS.Timer;

  /**
   * The cached gateway URL from Discord
   */
   public gatewayUrl!: string;

  /**
   * All of the channels this bot is apart of and managed by
   * your cache engine of choice.
   */
  public channels: ChannelStore;

  /**
   * The options we have set and any defaults available
   */
  public options: Required<types.ClientOptions>;

  /**
   * All of the guilds this bot is apart of and is managed
   * by cache.
   */
  public guilds: GuildStore;

  /**
   * Manager for handling sharding
   */
  public shards: ShardManager;

  /**
   * The token for the bot
   */
  public token!: string; // exposed in client, not in typings

  /**
   * If the bot's shard are ready or not
   */
  public ready: boolean = false;

  /**
   * All the users that this bot can see and managed
   * by the cache engine.
   */
  public users: UserStore;

  /**
   * The rest client available to make requests to Discord's REST API
   */
  public rest: RestClient;

  /**
   * The current self user.
   */
  public user!: SelfUser;

  /**
   * Defines a "WebSocketClient", where this is your main entrypoint
   * of running your Discord bot! ✧･ﾟ: \*✧･ﾟ:\*(\*❦ω❦)\*:･ﾟ✧*:･ﾟ✧
   *
   * @param options The options to construct this WebSocketClient.
   */
  constructor(options: types.ClientOptions) {
    super();

    this.options = Util.merge<any>(options, {
      ...defaults,
      token: options.token,
      rest: {
        token: options.token
      }
    }) as Required<types.ClientOptions>;

    this.channels = new ChannelStore(this);
    this.shards = new ShardManager(this);
    this.guilds = new GuildStore(this);
    this.users = new UserStore(this);
    this.rest = new RestClient(this.options.rest);

    Object.defineProperty(this, 'token', { value: this.options.token });

    this
      .rest
      .on('ratelimited', () => this.emit('restRatelimited'))
      .on('debug', (message) => this.emit('restDebug', message))
      .on('call', (properties) => this.emit('restCall', properties));

    /*
    this.once('ready', async() => {
      if (this.options.getAllUsers) {
        this.debug('[MEMBERS] Requesting all guild members...');
        await this.requestGuildMembers();
      }

      if (this.options.sweepUnneededCacheIn !== undefined && this.options.sweepUnneededCacheIn < 8640000) {
        this.debug(`[CACHE SWEEP] Enabled sweeping cache for ${this.options.sweepUnneededCacheIn / 1000} seconds.`);
        this._sweepInterval = setInterval(this._unsweep.bind(this)).unref();
      }
    });
    */
  }

  /**
   * Returns the encoding strategy to use for [`WebSocketClient.gatewayUrl`]
   */
  static get encoding() {
    try {
      require('erlpack');
      return 'etf';
    } catch {
      return 'json';
    }
  }

  /**
   * Returns the client's intents by their numeric value
   */
  get intents() {
    if (Array.isArray(this.options.intents)) {
      let bits = 0;
      for (let i = 0; i < this.options.intents.length; i++) {
        const intent = this.options.intents[i];
        if (!GatewayIntents.hasOwnProperty(intent))
          continue;

        bits |= GatewayIntents[intent];
      }

      return bits;
    } else {
      return this.options.intents;
    }
  }

  private debug(message: string) {
    this.emit('debug', message);
  }

  private _unsweep() {
    this.debug('[CACHE SWEEP] Un-needed cache is being swept up...');
    // todo: this
  }

  /**
   * Function call to connect to the gateway, this is your entrypoint
   * to connecting your bot to the stars! **✧( ु•⌄• )◞◟( •⌄• ू )✧**
   */
  async connect() {
    const shardInfo = await this.fetchShardInfo();
    this.gatewayUrl = `${shardInfo.url}/?v=${GatewayVersion}&encoding=${WebSocketClient.encoding}${this.options.compress ? '&encoding=zlib-stream' : ''}`;

    if (this.options.shardCount === 'auto')
      this.options.shardCount = shardInfo.shards;

    this.debug(`[Session Limit] ${shardInfo.session ? `${shardInfo.session.remaining}/${shardInfo.session.remaining} left` : 'Not auto-sharding'}`);
    for (let i = 0; i < (this.options.shardCount === 1 ? 1 : (this.options.shardCount as number) - 1); i++) {
      await this.shards.connect(i);
      await sleep(5000);
    }
  }

  /**
   * Disposes all shard connections if [`reconnect`] is set to `false`, or it'll
   * attempt to re-connect all shards if [`reconnect`] is `true` or `undefined`.
   *
   * @param reconnect If the client should start all shards
   */
  dispose(reconnect: boolean = true) {
    if (reconnect) {
      this.debug('[End of Life] Attempting to reconnect all shards to Discord...');
      for (const shard of this.shards.values())
        shard.dispose(true);

      return;
    }

    this.debug('[End of Life] Told to disconnect...');
    for (const shard of this.shards.values())
      shard.dispose(false);

    this.shards.clear();
  }

  /**
   * Method to retrieve shard information from Discord
   */
  async fetchShardInfo(): Promise<types.ShardingInfo> {
    const data = this.options.shardCount === 'auto'
      ? await this.getBotGateway()
      : await this.getGatewayInfo();

    if (!data.url || (this.options.shardCount === 'auto' && !(data as any).shards))
      throw new TypeError('Unable to retrieve shard information');

    const session: discord.APIGatewaySessionStartLimit | undefined =
      data.hasOwnProperty('session_start_limit') ? (data as discord.APIGatewayBotInfo).session_start_limit : undefined;

    if (session !== undefined && session.remaining <= 0) {
      const error = new Error('Exceeded the amount of tries to connect.');

      this.emit('error', error);
      return Promise.reject(error);
    }

    return {
      session,
      shards: this.options.shardCount === 'auto' ? (data as discord.APIGatewayBotInfo).shards : this.options.shardCount,
      url: data.url
    };
  }

  /**
   * Authenicated function to retrieve the gateway URL from Discord
   * and extra sharding metadata
   */
  getBotGateway() {
    return this.rest.dispatch<never, discord.RESTGetAPIGatewayBotResult>({
      endpoint: '/gateway/bot',
      method: 'GET'
    });
  }

  /**
   * Unauthenicated function to retrieve the gateway URL
   */
  getGatewayInfo() {
    return this.rest.dispatch<never, discord.RESTGetAPIGatewayResult>({
      endpoint: '/gateway',
      method: 'GET'
    });
  }

  /**
   * Sets the current activity for all shards
   * @param status The status to use
   * @param options The activity options
   */
  setActivity(status: types.OnlineStatus, options: types.SendActivityOptions) {
    for (const shard of this.shards.values())
      shard.setActivity(status, options);
  }

  /**
   * Returns the OAuth2 application of this client
   */
  getOAuthApplication() {
    return this.rest.dispatch<unknown, discord.APIApplication>({
      endpoint: '/oauth2/applications/@me',
      method: 'GET'
    }).then(data => new Application(this, data));
  }

  async requestGuildMembers() {
    // noop
  }

  /**
   * Method to retrieve all global slash commands
   *
   * [`Discord Docs`](https://discord.com/developers/docs/interactions/slash-commands#get-global-application-commands)
   */
  getGlobalSlashCommands() {
    return this.rest.dispatch<never, discord.RESTGetAPIApplicationCommandsResult>({
      endpoint: '/applications/:id',
      query: { id: this.user.id },
      method: 'GET'
    });
  }

  /**
   * Method to retrieve all guild slash commands
   *
   * [`Discord Docs`](https://discord.com/developers/docs/interactions/slash-commands#get-guild-application-commands)
   * @param guildID The guild's ID
   */
  getGuildSlashCommands(guildID: string) {
    return this.rest.dispatch<never, discord.RESTGetAPIApplicationGuildCommandsResult>({
      endpoint: '/applications/:id/guilds/:guildID/commands',
      method: 'GET',
      query: {
        id: this.user.id,
        guildID
      }
    });
  }

  /**
   * Method to retrieve a specific slash command by it's [[`commandID`]]
   *
   * [`Discord Docs`](https://discord.com/developers/docs/interactions/slash-commands#get-guild-application-command)
   * @param guildID The guild ID to retrieve the slash command for
   * @param commandID The command ID to retrieve
   */
  getGuildSlashCommand(guildID: string, commandID: string) {
    // todo: this
  }

  /**
   * Method to create a guild slash command
   *
   * [`Discord Docs`](https://discord.com/developers/docs/interactions/slash-commands#create-guild-application-command)
   * @param guildID The guild's ID
   * @param data The metadata or a [[InteractionCommandBuilder]] instance
   */
  createGuildSlashCommand(guildID: string, data: InteractionCommandBuilder | discord.RESTPostAPIApplicationGuildCommandsJSONBody) {
    if (data instanceof InteractionCommandBuilder)
      data = data.build();

    return this.rest.dispatch<discord.RESTPostAPIApplicationGuildCommandsJSONBody, void>({
      endpoint: '/applications/:appID/guilds/:guildID/commands',
      method: 'POST',
      query: {
        appID: this.user.id,
        guildID
      },

      data
    });
  }

  /**
   * Method to create a global slash command
   *
   * [`Discord Docs`](https://discord.com/developers/docs/interactions/slash-commands#create-global-application-command)
   * @param data The metadata or a [[InteractionCommandBuilder]].
   */
  createGlobalSlashCommand(data: InteractionCommandBuilder | discord.RESTPostAPIApplicationGuildCommandsJSONBody) {
    if (data instanceof InteractionCommandBuilder)
      data = data.build();

    return this.rest.dispatch<discord.RESTPostAPIApplicationGuildCommandsJSONBody, void>({
      endpoint: '/applications/:appID/commands',
      method: 'POST',
      query: {
        appID: this.user.id
      },

      data
    });
  }

  editGuildSlashCommand(guildID: string, commandID: string) {
    // todo: this
  }

  editGlobalSlashCommand(guildID: string) {
    // todo: this
  }

  deleteGlobalSlashCommand(commandID: string) {
    // todo: this
  }

  deleteGuildSlashCommand(guildID: string, commandID: string) {
    // todo: this
  }

  getAllSlashCommandPermissions(guildID: string) {
    // todo: this
  }

  getSlashCommandPermissions(guildID: string, commandID: string) {
    // todo: this
  }

  editSlashCommandPermissions(guildID: string, commandID: string) {
    // todo: this
  }

  editBulkSlashCommandsPermissions(guildID: string) {
    // todo: this
  }

  bulkOverwriteGuildSlashCommands(guildID: string) {
    // todo: this
  }

  /**
   * Retrieves a stage instance, if exists
   * @param channelID The stage channel ID
   */
  getStageInstance(channelID: string) {
    return this.rest.dispatch<APIStageInstance, never>({
      endpoint: '/stage-instances/:id',
      method: 'GET',
      query: { id: channelID }
    }).then(data => new StageInstance(this, data));
  }

  /**
   * Creates a stage instance asscoiated with the stage channel. The bot must
   * be a moderator of that stage channel.
   *
   * @param channelID The channel's ID
   * @param topic The topic to set
   * @param privacyLevel The privacy level to use
   */
  createStageInstance(channelID: string, topic: string, privacyLevel?: StageInstancePrivacyLevel) {
    return this.rest.dispatch<CreateStageInstance, APIStageInstance>({
      endpoint: '/stage-instances',
      method: 'POST',
      data: {
        privacy_level: privacyLevel,
        channel_id: channelID,
        topic
      }
    }).then(data => new StageInstance(this, data));
  }

  /**
   * Modifies fields of that stage instance
   * @param channelID The channel ID
   * @param data The data to modify
   */
  editStageInstance(channelID: string, data?: ModifyStageInstance) {
    return this.rest.dispatch<ModifyStageInstance, void>({
      endpoint: '/stage-instances/:id',
      method: 'PATCH',
      query: { id: channelID },
      data: {
        privacy_level: data?.privacy_level,
        topic: data?.topic
      }
    });
  }

  /**
   * Deletes the stage instance associated to that stage channel.
   * @param channelID The channel's ID
   */
  deleteStageInstance(channelID: string) {
    return this.rest.dispatch<never, void>({
      endpoint: '/stage-instances/:id',
      method: 'DELETE',
      query: { id: channelID }
    });
  }
}
