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

import type { ClientOptions as WebSocketClientOptions } from 'ws';
import { GatewayIntents, EventType, GatewayVersion } from './util/Constants';
import { Collection } from '@augu/immutable';
import { ClientUser } from './structures';
import { RESTClient } from './rest';
import { getOption } from './util';
import * as stores from './stores';
import * as models from './util/models';
import { Shard } from './sharding';

export type CacheType = 'guild' | 'user' | 'channel' | 'emoji' | 'member' | 'member:role' | 'message' | 'reaction' | 'presence';

/** The options to customize */
export interface ClientOptions {
  allowedMentions?: {
    [x in 'user' | 'role']: boolean;
  };
  disabledEvents?: EventType[];
  shardCount?: number | 'auto';
  cache?: 'all' | 'none' | CacheType | CacheType[];
  token: string;
  ws?: WebSocketOptions;
}

interface WebSocketOptions {
  guildSubscriptions?: boolean;
  largeThreshold?: number;
  connectTimeout?: number;
  clientOptions?: WebSocketClientOptions;
  compress?: boolean;
  intents?: GatewayIntents[];
  tries?: number;
}

interface NonNulledClientOptions {
  allowedMentions: { [x in 'user' | 'role']: boolean };
  disabledEvents: EventType[];
  shardCount: number | 'auto';
  cache: 'all' | 'none' | CacheType | CacheType[];
  ws: NonNulledWSOptions;
}

interface NonNulledWSOptions {
  guildSubscriptions: boolean;
  largeThreshold: number;
  connectTimeout: number;
  clientOptions: WebSocketClientOptions;
  compress: boolean;
  intents: GatewayIntents[];
  tries: number;
}

/**
 * Represents a non-sharded/clustered client
 */
export class Client {
  /**
   * Represents the first shard ID
   */
  public firstShardID: number;

  /**
   * Represents the last shard ID
   */
  public lastShardID: number;

  /** The gateway URL */
  public gatewayUrl?: string;

  /**
   * Represents the amount of channels (or the channel store if [ClientOptions.cache.channels] is enabled)
   */
  public channels: number | stores.ChannelStore;

  /**
   * The client's options
   */
  public options: NonNulledClientOptions;

  /**
   * Represents the amount of guilds (or the guild store if [ClientOptions.cache.guilds] is enabled)
   */
  public guilds: number | stores.GuildStore;

  /**
   * If the bot is ready to execute anything!
   */
  public ready: boolean;

  /** Collection of shards to use */
  public shards: Collection<Shard>;

  /**
   * Represents the amount of users (or the user store if [ClientOptions.cache.users] is enabled)
   */
  public users: number | stores.UserStore;

  /**
   * The bot's token (can't be evaled)
   */
  public token!: string;

  /**
   * The current user
   */
  public user: ClientUser | null;

  /**
   * The REST client
   */
  public rest: RESTClient;

  /**
   * Creates a new [Client]
   * @param opts The options to use
   */
  constructor(opts: ClientOptions) {
    this.firstShardID = 0;
    this.lastShardID = 1;
    this.channels = 0;
    this.options = {
      allowedMentions: getOption('allowedMentions', { user: true, role: true }, opts),
      disabledEvents: getOption('disabledEvents', [], opts),
      shardCount: getOption('shardCount', 'auto', opts),
      cache: getOption('cache', 'none', opts),
      ws: opts.hasOwnProperty('ws') ? (opts.ws! as any) : {
        guildSubscriptions: getOption('guildSubscriptions', false, opts.ws),
        largeThreshold: getOption('largeThreshold', 250, opts.ws),
        connectTimeout: getOption('connectTimeout', 15000, opts.ws),
        clientOptions: getOption('clientOptions', {}, opts.ws),
        compress: getOption('compress', false, opts.ws),
        intents: getOption('intents', [], opts.ws),
        tries: getOption('tries', 5, opts.ws)
      }
    };
    this.guilds = 0;
    this.shards = new Collection();
    this.ready = false;
    this.users = 0;
    this.user = null;
    this.rest = new RESTClient(opts.token);

    Object.defineProperty(this, 'token', {
      value: opts.token
    });
  }

  /**
   * Starts all shards
   */
  async start() {
    const data = this.options.shardCount === 'auto' ? await this.getBotGateway() : await this.getNormalGateway();
    if (!data.hasOwnProperty('url') || (this.options.shardCount === 'auto' && !data.hasOwnProperty('shards'))) throw new Error('Unable to fetch gateway URL');

    if (data.url.includes('?')) data.url = data.url.substring(0, data.url.indexOf('?'));
    this.gatewayUrl = `${data.url}/?v=${GatewayVersion}&encoding=etf`;

    if (this.options.shardCount === 'auto') {
      if (!data.hasOwnProperty('shards')) throw new Error('Unable to fetch data due to lack of data');

      this.options.shardCount = (data as models.BotGateway).shards;
      if (this.lastShardID === 0) this.lastShardID = (data as models.BotGateway).shards - 1;
    }

    for (let i = 0; i < this.lastShardID; i++) {
      const shard = new Shard(this, i);
      await shard.connect();
    
      this.shards.set(i, shard);
    }
  }

  /**
   * Gets the bot's gateway
   */
  getBotGateway() {
    return this.rest.dispatch<models.BotGateway>({
      method: 'GET',
      endpoint: '/bot/gateway'
    });
  }

  /**
   * Gets the normal gateway
   */
  getNormalGateway() {
    return this.rest.dispatch<models.Gateway>({ method: 'GET', endpoint: '/gateway' });
  }
}