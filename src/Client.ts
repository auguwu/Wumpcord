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

import { RestClientEvents as IRestClientEvents, RestClient } from '@wumpcord/rest';
import type { ShardEvents as IShardEvents } from './gateway/Shard';
import { ShardManager } from './gateway/ShardManager';
import type * as types from './types';
import { MemoryCache } from './cache/MemoryCache';
import { EventBus } from '@augu/utils';

import { ChannelStore } from './stores/ChannelStore';

type RestClientEvents = {
  [P in keyof IRestClientEvents as `rest${Capitalize<P>}`]: IRestClientEvents[P];
};

type ShardEvents = {
  [P in keyof IShardEvents as `shard${Capitalize<P>}`]: IShardEvents[P];
}

interface EntityBasedEvents {}

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
  cache: {
    engine: new MemoryCache()
  },
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
 * @typeparam O **~** Represents a custom object for creating libraries
 * of Wumpcord that extend the functionality of this class.
 *
 * @typeparam E **~** Represents a custom object for library creation
 * of this class to extend the event bus.
 */
export class WebSocketClient extends EventBus<WebSocketClientEvents> {
  protected _sweepInterval?: NodeJS.Timer;

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
   * The rest client available to make requests to Discord's REST API
   */
  public rest: RestClient;

  /**
   * Defines a "WebSocketClient", where this is your main entrypoint
   * of running your Discord bot! ✧･ﾟ: \*✧･ﾟ:\*(\*❦ω❦)\*:･ﾟ✧*:･ﾟ✧
   *
   * @param options The options to construct this WebSocketClient.
   */
  constructor(options: types.ClientOptions) {
    super();

    this.options = Object.assign(options, defaults, {
      token: options.token,
      rest: {
        token: options.token
      }
    }) as Required<types.ClientOptions>;

    this.channels = new ChannelStore(this);
    this.shards = new ShardManager(this);
    this.rest = new RestClient(this.options.rest);

    Object.defineProperty(this, 'token', { value: this.options.token });

    this
      .rest
      .on('ratelimited', () => this.emit('restRatelimited'))
      .on('debug', (message) => this.emit('restDebug', message))
      .on('call', (properties) => this.emit('restCall', properties));

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
  }

  private debug(message: string) {
    this.emit('debug', message);
  }

  private _unsweep() {
    this.debug('[CACHE SWEEP] Un-needed cache is being swept up...');
    // todo: this
  }

  async connect() {
    // todo: this
  }

  dispose(reconnect: boolean = true) {
    // todo: this
  }

  async shardInfo() {
    // todo: this
  }

  setActivity() {
    // noop
  }

  requestGuildMembers() {
    // noop
  }

  getGlobalSlashCommands() {
    // todo: this
  }

  getGuildSlashCommands(guildID: string) {
    // todo: this
  }

  createGuildSlashCommand(guildID: string) {
    // todo: this
  }

  createGlobalSlashCommand(guildID: string) {
    // todo: this
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
}
