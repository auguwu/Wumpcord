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

import type { CategoryChannel, DMChannel, GroupChannel, NewsChannel, StageChannel, StoreChannel, TextChannel, VoiceChannel } from './entities';
import type { ClientOptions as WebSocketClientOptions } from 'ws';
import type { RestClientOptions, MessageFile } from '@wumpcord/rest';
import type { AbstractEntityCache } from './cache';
import type { GatewayIntent } from './Constants';
import type { BaseEntity } from './entities/BaseEntity';
import type * as discord from 'discord-api-types';


/** Represents a partial entity with `id` and any additional properties visible if not cached */
export type PartialEntity<T extends BaseEntity<any>, Props = {}> = Partial<T> & { [P in keyof Props]: Props[P]; } & { id: string };

/** Represents all of the online statuses to set */
export type OnlineStatus = 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';

/** Represents any channel */
export type AnyChannel = CategoryChannel | DMChannel | GroupChannel | NewsChannel | StageChannel | StoreChannel | VoiceChannel | TextChannel;

/** Represents any guild channel, which has more properties than DMChannel and GroupChannel. */
export type AnyGuildChannel = CategoryChannel | NewsChannel | StageChannel | StoreChannel | VoiceChannel | TextChannel;

/** Represents any textable channel, which can send messages */
export type AnyTextableChannel = NewsChannel | TextChannel | DMChannel | GroupChannel;

/** Represents any guild textable channel, which are text channels in guilds */
export type AnyGuildTextableChannel = NewsChannel | TextChannel;

/**
 * Represents of how a Discord message is constructed
 */
export type MessageContent = string | MessageContentOptions;

/**
 * Represents the options for constructing a [[Client]]
 */
export interface ClientOptions {
  /**
   * Number of milliseconds to recycle un-needed cache
   */
  sweepUnneededCacheIn?: number;

  /**
   * If we populate presences from [[Shard.requestGuildMembers]]
   */
  populatePresences?: boolean;

  /**
   * List of allowed mentions to use if `mentions` from [[AllowedMentions]] is not set.
   */
  allowedMentions?: AllowedMentions;

  /**
   * If the client should call [[Shard.requestGuildMembers]] on every shard
   * once the bot is ready.
   */
  getAllUsers?: boolean;

  /**
   * The (de)-serialization strategy to use
   *
   * @deprecated This property is deprecated in favour of the library
   * detecting. This will be removed in a future release.
   */
  strategy?: 'etf' | 'json';

  /**
   * Enables compression of data packets, it requires
   * the `zlib-sync` module to be enabled.
   */
  compress?: boolean;

  /**
   * The shard count to use, for automatic sharding, use `'auto'`
   */
  shardCount?: number | 'auto';

  /**
   * List of intents to use for this bot.
   */
  intents?: number | GatewayIntent[];

  /**
   * The caching strategy to customize the cache you need
   */
  cache?: CachingOptions;

  /**
   * The token to authenicate to Discord's gateway and REST
   */
  token: string;

  /**
   * Options to modify the rest client attached to this [[Client]].
   */
  rest?: RestClientOptions;

  /**
   * List of WebSocket options for connecting to the Gateway
   */
  ws?: WebSocketOptions;
}

/**
 * Represents options for establishing a peer to peer connection with Discord
 * to the world! **☆=(ゝω･)/**
 */
export interface WebSocketOptions {
  /**
   * Value between 50 and 250, total number of members where the gateway will stop sending offline members in the guild member list
   * @default true
   */
  largeThreshold?: number;

  /**
   * Timeout in milliseconds to stop dispatching connection timeouts
   * once the connection wasn't established.
   * @default 25000
   */
  connectTimeout?: number;

  /**
   * The client options for [ws](https://npm.im/ws) (Do not mess with this unless you know what you're doing.)
   * @default undefined
   */
  clientOptions?: WebSocketClientOptions;

  /**
   * Whether this connection supports compression of packets (requires `zlib-sync` to be installed)
   * @default false
   */
  compress?: boolean;
}

/**
 * Options to customize caching with Wumpcord.
 */
export interface CachingOptions {
  /**
   * Engine to use when caching guild voice states
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  voiceStates?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * Engine to use when caching guild presences
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  presences?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * Engine to use when caching channel messages
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  messages?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * Engine to use when caching channels
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  channels?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * Engine to use when caching guild members
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  members?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * The default entity cache engine to use, you can also override
   * a specific entity's cache engine, for an example, if you don't
   * need to cache channels, you can just set `channels` to a instance
   * of [[NoopEntityCache]].
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  engine?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * Engine to use when caching guilds
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  guilds?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * Engine to use when caching users
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  users?: AbstractEntityCache | 'memory' | 'no-op';

  /**
   * Engine to use when caching guild roles
   *
   * > **NOTE**: If you do not want to construct a new instance
   * of an [[AbstractEntityCache]] engine, you can just specify
   * the built in ones: `'memory'` or `'no-op'`
   */
  roles?: AbstractEntityCache | 'memory' | 'no-op';
}

/**
 * Options to customizing the [[MessageContentOptions.mentions]] to populate
 * default items in that object for simplicity
 */
export interface AllowedMentions {
  /** If we should allow the bot to ping @everyone/@here */
  everyone?: boolean;

  /** If we should ping the user we replied with the message reference */
  replied?: boolean;

  /** Boolean value of `true` if we should parse every role as a mentionable ping or an Array of role ids */
  roles?: boolean | string[];

  /** Boolean value of `true` if we should parse every role as a mentionable ping or an Array of user ids */
  users?: boolean | string[];
}

/**
 * Additional options to send a message in a guild textable channel on Discord.
 */
export interface MessageContentOptions {
  /**
   * Allows to send one or multiple attachments.
   *
   * @deprecated This property is deprecated for [[MessageContentOptions.file]],
   * this property will be removed in a future release.
   */
  attachments?: MessageFile | MessageFile[];

  /**
   * Customizes the behaviour for sending mentions towards entities or everyone.
   */
  mentions?: AllowedMentions;

  /**
   * The raw content to send to Discord.
   */
  content?: string;

  /**
   * A custom embed to send to Discord
   */
  embed?: discord.APIEmbed;

  /**
   * If we should send a message with a reply of this message's ID
   * as the reply reference.
   */
  reply?: string;

  /**
   * A file to send on Discord
   */
  file?: MessageFile;

  /**
   * If we should use Text to Speech on this message
   */
  tts?: boolean;
}

/**
 * Object of what [[Client.getShardInfo]] returns.
 */
export interface ShardingInfo {
  /**
   * A starting session object, used when [[Client.getBotGateway]]
   * is called rather than [[Client.getGatewayInfo]].
   */
  session?: discord.APIGatewaySessionStartLimit;

  /**
   * Number of shards to spawn
   */
  shards: number;

  /**
   * The gateway URL, cached as [[Client.gatewayUrl]]
   */
  url: string;
}

export interface SendActivityOptions {
  /**
   * The list of activities to display
   */
  activities: discord.GatewayActivity[];

  /**
   * Whenther or not the client is AFK
   */
  afk?: boolean;
}
