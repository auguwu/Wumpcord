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

import WebSocket, { ClientOptions as WebSocketClientOptions } from 'ws';
import { Collection, Queue } from '@augu/collections';
import { Readable } from 'stream';
import * as discord from 'discord-api-types';

import * as events from './events';
import * as models from './models';

declare namespace Wumpcord {
  // ~ Constants ~
  /**
   * Returns the version of Wumpcord
   */
  export const version: string;

  // ~ Types ~
  /**
   * Represents of how a Discord message is constructed
   */
  export type MessageContent = string | Wumpcord.MessageContentOptions;

  /**
   * Represents a serialization strategy to send packets to Discord
   */
  export type Serializable = (...args: any[]) => string | Buffer;

  /**
   * Represents a deserialization strategy to decode packets from Discord
   */
  export type Deserializable<T> = (...args: any[]) => T;

  /**
   * Types of statuses to display
   */
  export type OnlineStatus = 'online' | 'offline' | 'idle' | 'dnd';

  /**
   * Type to check if [T] is a Promise or [T] itself.
   */
  export type MaybePromise<T> = T | Promise<T>;

  /**
   * Represents a partial entity. If a entity isn't cached,
   * it'll just return `id` / any external properties or
   * it'll return the entity itself
   */
  export type PartialEntity<T, R extends object = {}> = Partial<T> & {
    [P in keyof R]: R[P];
  } & {
    id: string
  };

  /**
   * Represents how a file is sent from Wumpcord to Discord
   */
  export interface MessageFile {
    /**
     * The name of the file
     * @default 'file.png'
     */
    name?: string;

    /**
     * The binary data to send. If [file] is a [Readable],
     * then it'll parse it to a [Buffer] which is a lot
     * slower than sending a Buffer.
     */
    file: Buffer | Readable;
  }

  /**
   * Represents the options to configure Wumpcord
   */
  export interface ClientOptions {
    /**
     * If we should require the `presences` attribute when requesting
     * guild members using `WebSocketClient.requestGuildMembers`. This will
     * be disabled if the bot doesn't have `guildPresences` available.
     *
     * @default false
     */
    populatePresences?: boolean;

    /**
     * Time in milliseconds to reconnect to Discord
     * if we disconnected for some reason
     *
     * @default 7000
     */
    reconnectTimeout?: number;

    /**
     * Any gateway events to not be emitted when received
     *
     * @default []
     */
    disabledEvents?: Wumpcord.Constants.GatewayEvent[];

    /**
     * If we should enable the Interactions Helper to help
     * with slash commands
     *
     * @default false
     */
    interactions?: boolean;

    /**
     * If we should call `WebSocketClient.requestGuildMembers` to fetch the
     * latest member cache and populate it. This will be disabled if the
     * `guildMembers` intent isn't available
     *
     * @default false
     */
    getAllUsers?: boolean;

    /**
     * Fixed amount of shards to spawn or `'auto'` to get the
     * recommended shard count and create a pool from that
     */
    shardCount?: number | 'auto';

    /**
     * Serialization/Deserialization strategy to use when encoding/decoding
     * packets from Discord
     *
     * @default 'json'
     */
    strategy?: 'etf' | 'json';

    /**
     * The token to authenicate with Discord
     */
    token: string;

    /**
     * Additional options to connect to the gateway
     */
    ws?: Wumpcord.WebSocketOptions;
  }

  /**
   * Additional options to connect to the gateway
   */
  export interface WebSocketOptions {
    /** Enables dispatching of guild subscription events (presence and typing events) */
    guildSubscriptions?: boolean;

    /** Value between 50 and 250, total number of members where the gateway will stop sending offline members in the guild member list */
    largeThreshold?: number;

    /** The connection timeout before closing the shard's connection */
    connectTimeout?: number;

    /** The client options for [ws](https://npm.im/ws) (Do not mess with this unless you know what you're doing.) */
    clientOptions?: WebSocketClientOptions;

    /** Whether this connection supports compression of packets */
    compress?: boolean;

    /** The intents to connect with */
    intents?: number | number[] | Wumpcord.Constants.GatewayIntent[];

    /** Number of tries before closing the shard's connection, leave it as `undefined` to indefintely keep re-connecting */
    tries?: number;
  }

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

  export interface ShardInfo {
    /** Session details to connect to, this is populated if `ClientOptions.shardCount` is `'auto'` */
    session?: discord.APIGatewaySessionStartLimit;

    /** Number of shards to connect to */
    shards: number;

    /** The gateway URL to connect to */
    url: string;
  }

  export interface MessageContentOptions {
    /**
     * List of attachments to send to Discord
     */
    attachments?: Wumpcord.MessageFile | Wumpcord.MessageFile[];

    /**
     * Object of allowed mentions available, defaults in [ClientOptions]
     * will be overrided if none are provided
     */
    mentions?: Wumpcord.AllowedMentions;

    /**
     * The content to send to Discord
     */
    content?: string;

    /**
     * A rich embed to send
     */
    embed?: discord.APIEmbed | Wumpcord.EmbedBuilder;

    /**
     * If we should reply to the user as a referenced message
     */
    reply?: string;

    /**
     * If we should enable Text to Speech
     */
    tts?: boolean;
  }

  export interface RestCallProperties {
    /** Ratelimit information */
    ratelimitInfo: Wumpcord.RatelimitInfo;

    /** If the request was successful or not */
    successful: boolean;

    /** The endpoint requested */
    endpoint: string;

    /** The HTTP method verb */
    method: Wumpcord.HTTPMethod;

    /** The response from Discord */
    body: string;

    /** The ping from dispatched -> requested */
    ping: number;
  }

  export interface SendActivityOptions {
    /** The text to display */
    name: string;

    /**
     * The type to set as
     *
     * - 0: **Playing**
     * - 1: **Streaming**
     * - 2: **Listening to**
     * - 5: **Competing In**
      */
    type: 0 | 1 | 2 | 5;

    /** The url to display in the **Streaming** status */
    url?: string;

    /** If we are AFK from Discord (why would you even use this?!) */
    afk?: boolean;
  }

  export * from './events';
}

export as namespace Wumpcord;
