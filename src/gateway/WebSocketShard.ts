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

import { Guild, SelfUser } from '../models';
import type * as discord from 'discord-api-types/v8';
import type * as types from '../types';
import * as Constants from '../Constants';
import { EventBus } from '@augu/utils';
import type Client from './WebSocketClient';
import type InteractionClient from '../interactions/InteractionClient';
import WebSocket from 'ws';
import Util from '../util';

import * as events from '../events';


let Erlpack: typeof import('erlpack');
try {
  Erlpack = require('erlpack');
} catch(ex) {
  // noop
}

interface WebSocketShardEvents {
  close(id: number, error: Error, recoverable: boolean): void;
  ready(id: number, unavailable?: Set<string>): void;
  resume(id: number, replayed: number): void;
  debug(id: number, message: string): void;
  unknown(id: number, data: any): void;
  error(id: number, error: Error): void;
  disconnect(id: number): void;
  establish(id: number): void;
}

export default class WebSocketShard extends EventBus<WebSocketShardEvents> {
  /** The heartbeat interval to send out a [Heartbeat] packet to Discord */
  private _heartbeatInterval?: NodeJS.Timer;

  /** The reconnection timeout */
  private _reconnectTimeout?: NodeJS.Timeout;

  /** The ready timeout */
  private _readyTimeout?: NodeJS.Timeout;

  /** List of unavailable guilds known to this shard */
  public unavailableGuilds: Set<string>;

  /** The last time we received an acked response */
  public lastReceivedAt: number;

  /** The reconnect timeout to use */
  private reconnectTime: number;

  /** The session ID, this is populated when we receive a HELLO packet from Discord */
  private sessionID?: string;

  /** The last time we acked a response */
  public lastAckedAt: number;

  /** The resolver function from [WebSocketShard._createConnection] */
  private resolver?: (value: any) => void;

  /** The rejecter function from [WebSocketShard._createConnection] */
  private rejecter?: (error: any) => void;

  /** The closing sequence number */
  public closeSeq?: number;

  /** The serialization strategy to use when encoding/decoding packets */
  public strategy: types.ClientOptions['strategy'];

  /** The [WebSocketClient | InteractionClient] attached to this shard */
  private client: Client;

  public ready: boolean = false;

  /** The status of the shard */
  public status: 'connected' | 'handshaking' | 'nearly' | 'dead' | 'waiting_for_guilds';

  /** Guild cache for this shard, this is disabled if not provided. */
  public guilds: Set<string>;

  /** If we acked a heartbeat response for not */
  private acked: boolean;

  /** The sequence number for resuming sessions */
  private seq: number;

  /** The actual WebSocket connection from Discord to us, initialised using [WebSocketShard.connect] */
  private ws!: WebSocket | null;

  /** The shard's ID */
  public id: number;

  /**
   * Gateway class to handle connections from Discord
   * @param client The [WebSocketClient] to attach
   * @param id The shard's ID
   * @param strategy The (de)serialization strategy to use
   */
  constructor(client: Client, id: number, strategy: types.ClientOptions['strategy']) {
    super();

    if (strategy === 'etf' && Erlpack === undefined)
      throw new SyntaxError('Serialization strategy is set to `etf`, but `erlpack` isn\'t installed?');

    this.unavailableGuilds = new Set();
    this.lastReceivedAt = -1;
    this.reconnectTime = client.options.reconnectTimeout ?? 7000;
    this.lastAckedAt = -1;
    this.sessionID = undefined;
    this.strategy = strategy;
    this.status = Constants.ShardStatus.Dead;
    this.client = client;
    this.guilds = new Set();
    this.acked = true;
    this.seq = -1;
    this.id = id;
  }

  /**
   * Returns the ping of this shard
   */
  get ping() {
    return this.lastReceivedAt === -1 ? -1 : (this.lastReceivedAt - this.lastAckedAt);
  }

  /**
   * Returns the serialization strategy to encode packets to Discord
   */
  get pack(): types.Serializable {
    return this.strategy === 'etf' ? Erlpack.pack : JSON.stringify;
  }

  /**
   * Returns the deserialization strategy to decode packets to Discord
   */
  get unpack(): types.Deserializable {
    return this.strategy === 'etf' ? Erlpack.unpack : JSON.parse;
  }

  debug(message: string) {
    this.emit('debug', this.id, message);
  }

  /**
   * Establishes a new connection with Discord, and connects to the gateway.
   */
  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.status === Constants.ShardStatus.Connected)
    ) {
      this.debug('WebSocket connection is already established, not creating a new instance.');
      return Promise.resolve(); // just resolve it
    }

    this.debug(`Creating a new session to Discord. (${this.sessionID ? 'using old session ID' : 'creating new session'})`);
    this.status = Constants.ShardStatus.Handshaking;
    return this._createConnection();
  }

  /**
   * Disconnects from the gateway, if [reconnect] is `true` then spawn a new connection
   * @param reconnect If we should reconnect or not
   * @param closeCode The close code to send out if needed
   */
  disconnect(reconnect: boolean = true, closeCode?: number) { // eslint-disable-line default-param-last
    if (!this.ws) return;
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = undefined;
    }

    if (this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.removeListener('close', this._onClose.bind(this));
      try {
        if (reconnect && this.sessionID !== undefined) {
          if (this.ws.readyState === WebSocket.OPEN)
            this.ws.close(4901, 'Reconnect: Wumpcord');
          else
            this.ws.terminate();
        } else {
          this.ws.close(closeCode ?? 1000, 'Reconnect: Wumpcord');
        }
      } catch(ex) {
        this.debug(`Unable to terminate WebSocket connection\n${ex.stack}`);
        this.emit('error', this.id, ex);
      }
    }

    this.status = Constants.ShardStatus.Dead;
    this.ws = null;
    this.emit('disconnect', this.id);

    if (reconnect) {
      if (this.sessionID !== undefined) {
        this.debug('Potentially resuming zombified connection...');
        this.client.shards.connect(this.id);
      } else {
        this.debug('Attempting to unzombify this connection...');
        setTimeout(() => this.client.shards.connect(this.id), this.reconnectTime);

        this.reconnectTime = Math.min(Math.round(this.reconnectTime * (Math.random() * 2 + 1)), 30000);
      }
    } else {
      this.debug('Shard has reached it\'s end of life.');
      this._hardReset();
    }
  }

  /**
   * Sends a packet to Discord
   * @param op The OPCode to use
   * @param data The optional data to use
   */
  send<T = unknown>(op: Constants.OPCodes, data?: T) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(this.pack({ op, d: data }));
      this.debug(`-> "${op} (${Util.getKey(Constants.OPCodes, op) ?? 'Unknown'})"`);
    } else {
      this.debug('Connection has not been established yet, skipping');
    }
  }

  /**
   * Sets the presence for this shard
   * @param status The status to use
   * @param options The options to use
   */
  setStatus(status: types.OnlineStatus, options: types.SendActivityOptions) {
    this.send(Constants.OPCodes.StatusUpdate, {
      status,
      since: status === 'idle' ? Date.now() : 0,
      afk: Util.get(options, 'afk', false),
      game: {
        name: options.name,
        type: options.type,
        url: options.url
      }
    });
  }

  _checkReady() {
    if (this._readyTimeout !== undefined) clearTimeout(this._readyTimeout);
    if (!this.unavailableGuilds.size) {
      this.debug('Recieved all guilds from Discord, marking shard as ready.');

      this.status = Constants.ShardStatus.Connected;
      this.ready = true;
      this.emit('ready', this.id);

      return;
    }

    this._readyTimeout = setTimeout(() => {
      this.debug(`Didn't received any more guild packets in the last 15 seconds, ${this.unavailableGuilds.size} unavailable guilds.`);
      this._readyTimeout = undefined;

      this.status = Constants.ShardStatus.Connected;
      this.emit('ready', this.id, this.unavailableGuilds);
    }, 15000);
  }

  private _hardReset() {
    this.sessionID = undefined;
    this.seq = -1;
  }

  private _identify() {
    this.debug('Identifying....');

    const packet: discord.GatewayIdentifyData = {
      guild_subscriptions: Boolean(this.client.options.ws?.guildSubscriptions ?? false),
      large_threshold: this.client.options.ws?.largeThreshold ?? 250,
      compress: false,
      intents: this.client.intents,
      token: this.client.token,
      properties: {
        $browser: 'Wumpcord',
        $device: 'Wumpcord',
        $os: process.platform
      }
    };

    if (this.client.options.shardCount! > 0) packet.shard = [this.id, this.client.options.shardCount as number];
    return this.send(Constants.OPCodes.Identify, packet);
  }

  private _createConnection() {
    this.debug('Creating a new WebSocket connection...');

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.client.gatewayURL, this.client.options.ws?.clientOptions);

      this.ws.on('message', this._onMessage.bind(this));
      this.ws.on('error', this._onError.bind(this));
      this.ws.on('close', this._onClose.bind(this));
      this.ws.on('open', this._onOpen.bind(this));

      this.resolver = resolve;
      this.rejecter = reject;

      this._reconnectTimeout = setTimeout(() => {
        this.debug('Didn\'t create connection in time, reconnecting...');
        this.disconnect(true);

        this.rejecter!(new Error('Didn\'t create a connection in-time.'));
        this.rejecter = undefined;
      }, this.reconnectTime);
    });
  }

  private _serialize(data: WebSocket.Data) {
    let packet: discord.GatewayReceivePayload | null = null;
    let d = data;

    try {
      if (data instanceof ArrayBuffer) {
        if (Erlpack) d = Buffer.from(data);
      } else if (Array.isArray(data)) {
        d = Buffer.concat(data);
      }

      packet = this.unpack(Buffer.isBuffer(d) ? d : data.toString()) as unknown as discord.GatewayReceivePayload;
    } catch(ex) {
      this.emit('error', this.id, ex);
      packet = null;
    }

    return packet;
  }

  private _onOpen() {
    this.debug('Established a connection with Discord');
    this.emit('establish', this.id);

    if (this._reconnectTimeout) clearTimeout(this._reconnectTimeout);
  }

  private _onClose(code: number, reason: string) {
    if (this.seq !== -1) this.closeSeq = this.seq;

    if (code) {
      const isClean = code === 1000;
      this.debug(`WebSocket connection has been terminated by Discord ${isClean ? 'cleanly' : 'uncleanly'} for ${reason || '<unknown>'}`);
      let error = new Error(`${code}: ${reason || '<unknown>'}`);

      switch (code) {
        case 4001: {
          error = new Error('Gateway received an invalid OPCode');
        } break;

        case 4002: {
          error = new Error('Gateway received an invalid message');
        } break;

        case 4003: {
          error = new Error('Gateway wasn\'t authenicated');
          this.sessionID = undefined;
        } break;

        case 4004: {
          error = new Error('Authenication failed while logging in');

          this.sessionID = undefined;
          this.emit('error', this.id, new Error(`Invalid token "${this.client.token}"`));
        } break;

        case 4005: {
          error = new Error('Gateway is already authenicated');
        } break;

        case 4006:
        case 4009: {
          error = new Error('Invalid session');
          this.sessionID = undefined;
        } break;

        case 4007: {
          error = new Error(`Invalid sequence number: ${this.seq}`);
          this.seq = 0;
        } break;

        case 4008: {
          error = new Error('Ratelimited while authenicating/sending packets');
        } break;

        case 4010: {
          error = new Error('Invalid shard');
          this.sessionID = undefined;
        } break;

        case 4011: {
          error = new Error('Shard includes too many guilds (>2500)');
          this.sessionID = undefined;
        } break;

        case 4013: {
          error = new Error('Invalid intents were specified');
          this.sessionID = undefined;
        } break;

        case 4014: {
          error = new Error('Disallowed intents were specified');
          this.sessionID = undefined;
        } break;

        case 1006: {
          error = new Error('Connection was reset');
        } break;
      }

      this.emit('close', this.id, error, Constants.UnrecoverableCodes.includes(code));
    } else {
      this.debug(`Unknown close code "${code}"`);
    }

    if (Constants.UnrecoverableCodes.includes(code)) {
      this.debug(`Code "${code}" is un-recoverable, shard is dead.`);
      this.disconnect(false);
    } else {
      this.debug(`Code "${code}" is recoverable! Reconnecting...`);
      this.disconnect(true);
    }
  }

  private _onError(error: Error) {
    this.emit('error', this.id, error);
  }

  private async _onMessage(packet: WebSocket.Data) {
    const data = this._serialize(packet);
    if (data === null) {
      this.emit('error', this.id, new Error('Received nullified data packet, skipping'));
      return;
    }

    this.debug(`<- "${data.op} (${Util.getKey(Constants.OPCodes, data.op as number) || '<unknown>'})"`);
    if (data.s !== null && data.s > this.seq) {
      this.debug(`Received new sequence number: ${data.s}`);
      this.seq = data.s;
    }

    if (data.op === 0) this.debug(`Received new gateway event "${(data as discord.GatewayDispatchPayload).t}"`);

    switch (data.op as number) {
      case Constants.OPCodes.Event: {
        const { d, t } = data as discord.GatewayDispatchPayload;

        if (
          this.status === Constants.ShardStatus.WaitingForGuilds &&
          t === <any> Constants.GatewayEvents.GuildCreate
        ) {
          const guild = d as discord.GatewayGuildCreateDispatchData;
          this.unavailableGuilds.delete(guild.id);

          const g = new Guild(this.client, { shard_id: this.id, ...guild });
          this.guilds.add(guild.id);
          this.client.guilds.add(g);

          this._checkReady();
        } else {
          // respect disabled events
          if (this.client.options.disabledEvents?.includes(t as any))
            break;

          await this._wsEvent(data as any);
        }
      } break;

      case Constants.OPCodes.Heartbeat:
        this._ackHeartbeat();
        break;

      case Constants.OPCodes.InvalidSession: {
        this.debug(`Session ID "${this.sessionID}" is invalid, re-creating session`);

        this.sessionID = undefined;
        this.seq = -1;
        this._identify();
      } break;

      case Constants.OPCodes.Reconnect:
        this.debug('Told to re-connect, so reconnecting...');
        this.disconnect(true);
        break;

      case Constants.OPCodes.Hello: {
        this.debug('Received `HELLO` packet!');

        if (this._heartbeatInterval !== undefined) {
          clearInterval(this._heartbeatInterval);
          this._heartbeatInterval = undefined;
        }

        const packet = data as discord.GatewayHello;
        this._heartbeatInterval = setInterval(() => this._ackHeartbeat(), packet.d.heartbeat_interval).unref();
        this.status = Constants.ShardStatus.Nearly;

        if (this.sessionID) {
          this._ackHeartbeat();
          this._resume();
        } else {
          this._identify();
        }
      } break;

      case Constants.OPCodes.HeartbeatAck:
        this.acked = true;
        this.lastReceivedAt = Date.now();
        this.debug('Connection is now stable.');
        break;

      default:
        this.emit('unknown', this.id, data);
        break;
    }
  }

  private _ackHeartbeat() {
    if (!this.acked) {
      this.debug('Didn\'t receive heartbeat back');
      return this.disconnect(true, 1012);
    }

    this.lastAckedAt = Date.now();
    this.acked = false;

    this.send(Constants.OPCodes.Heartbeat, this.seq);
    this.debug('Sent heartbeat to Discord!');
  }

  private _resume() {
    this.send<discord.GatewayResumeData>(Constants.OPCodes.Resume, {
      session_id: this.sessionID!,
      token: this.client.token,
      seq: this.seq
    });
  }

  private async _wsEvent(data: discord.GatewayDispatchPayload) {
    switch (data.t) {
      case 'READY': {
        if (!this.client.user) this.client.user = new SelfUser(this.client, data.d.user);

        this.debug(`Received READY packet, hello ${this.client.user.tag} <3`);
        this.sessionID = data.d.session_id;
        this.client.users.add(this.client.user);
        this.unavailableGuilds = new Set(data.d.guilds.map(r => r.id));
        this.status = Constants.ShardStatus.WaitingForGuilds;
        this.resolver?.(null);
        this._checkReady();
      } break;

      case 'RESUMED': {
        this.debug(`Session "${this.sessionID}" has replayed ${(data.s - this.seq).toLocaleString()} events.`);

        const replayed = (data.s - this.seq);
        this.emit('resume', this.id, replayed);
      } break;

      case 'USER_UPDATE': {
        const event = new events.UserUpdateEvent(this, data.d);
        event.process();

        this.client.emit('userUpdate', event);
      } break;

      case 'WEBHOOKS_UPDATE': {
        const event = new events.WebhooksUpdateEvent(this, data.d);
        event.process();

        this.client.emit('webhooksUpdate', event);
      } break;

      case 'TYPING_START': {
        const event = new events.TypingStartEvent(this, data.d);
        await event.process();

        this.client.emit('typingStart', event);
      } break;

      case 'VOICE_SERVER_UPDATE': {
        const event = new events.VoiceServerUpdateEvent(this, data.d);
        event.process();

        this.client.emit('voiceServerUpdate', event);
      } break;

      case 'VOICE_STATE_UPDATE': {
        const event = new events.VoiceStateUpdateEvent(this, data.d);
        event.process();

        this.client.emit('voiceStateUpdate', event);
      } break;

      case 'PRESENCE_UPDATE': {
        const event = new events.PresenceUpdateEvent(this, data.d);
        event.process();

        this.client.emit('presenceUpdate', event);
      } break;

      case 'MESSAGE_CREATE': {
        const event = new events.MessageCreateEvent(this, data.d);
        await event.process();

        this.client.emit('message', event);
      } break;

      case 'INTERACTION_CREATE': {
        if (data.d.type === 1) return this.debug('Ping! Received interaction response.');

        if (Object.prototype.hasOwnProperty.call(this.client, 'interactions')) {
          const event = new events.InteractionCreateEvent(this, data.d);
          await event.process();

          (this.client as InteractionClient).emit('interactionReceive', event);
        } else {
          this.debug('Received INTERACTION_CREATE packet but client is not InteractionClient.');
        }

      } break;

      case 'MESSAGE_DELETE': {
        const event = new events.MessageDeleteEvent(this, data.d);
        event.process();

        this.client.emit('messageDelete', event);
      } break;

      case 'MESSAGE_UPDATE': {
        const event = new events.MessageUpdateEvent(this, data.d);
        event.process();

        this.client.emit('messageUpdate', event);
      } break;

      case 'MESSAGE_REACTION_ADD': {
        const event = new events.MessageReactionAddEvent(this, data.d);
        event.process();

        this.client.emit('messageReactionAdd', event);
      } break;

      case 'MESSAGE_REACTION_REMOVE': {
        const event = new events.MessageReactionRemoveEvent(this, data.d);
        event.process();

        this.client.emit('messageReactionRemove', event);
      } break;

      case 'MESSAGE_REACTION_REMOVE_ALL': {
        const event = new events.MessageReactionRemoveAllEvent(this, data.d);
        event.process();

        this.client.emit('messageReactionRemoveAll', event);
      } break;

      case 'MESSAGE_REACTION_REMOVE_EMOJI': {
        const event = new events.MessageReactionRemoveEmojiEvent(this, data.d);
        event.process();

        this.client.emit('messageReactionRemoveEmoji', event);
      } break;

      case 'INVITE_CREATE': {
        const event = new events.InviteCreateEvent(this, data.d);
        event.process();

        this.client.emit('inviteCreate', event);
      } break;

      case 'INVITE_DELETE': {
        const event = new events.InviteDeleteEvent(this, data.d);
        event.process();

        this.client.emit('inviteDelete', event);
      } break;

      case 'CHANNEL_CREATE': {
        const event = new events.ChannelCreateEvent(this, data.d);
        event.process();

        this.client.emit('channelCreate', event);
      } break;

      case 'CHANNEL_DELETE': {
        const event = new events.ChannelDeleteEvent(this, data.d);
        event.process();

        this.client.emit('channelDelete', event);
      } break;

      case 'CHANNEL_UPDATE': {
        const event = new events.ChannelUpdateEvent(this, data.d);
        event.process();

        this.client.emit('channelUpdate', event);
      } break;

      case 'CHANNEL_PINS_UPDATE': {
        const event = new events.ChannelPinsUpdateEvent(this, data.d);
        event.process();

        this.client.emit('channelPinsUpdate', event);
      } break;

      case 'GUILD_CREATE': {
        const event = new events.GuildCreateEvent(this, data.d);
        const available = event.process();

        if (available) {
          this.debug(`Guild ${event.guild.id} was previously unavailable, and now is available! Emitting \`guildAvailable\`...`);
          this.client.emit('guildAvailable', event.guild);
        } else {
          this.client.emit('guildCreate', event);
        }
      } break;

      case 'GUILD_DELETE': {
        const event = new events.GuildDeleteEvent(this, data.d);
        const unavailable = event.process();

        if (unavailable) {
          this.debug(`Guild "${event.guild.id}" is unavailable, emitting \`guildUnavailable\` event.`);
          this.client.emit('guildUnavailable', event.guild);
        } else {
          this.client.emit('guildDelete', event);
        }
      } break;

      case 'GUILD_UPDATE': {
        const event = new events.GuildUpdateEvent(this, data.d);
        event.process();

        this.client.emit('guildUpdate', event);
      } break;

      case 'GUILD_EMOJIS_UPDATE': {
        const event = new events.GuildEmojisUpdateEvent(this, data.d);
        event.process();

        this.client.emit('guildEmojisUpdate', event);
      } break;

      case 'GUILD_INTEGRATIONS_UPDATE': {
        const event = new events.GuildIntegrationsUpdateEvent(this, data.d);
        event.process();

        this.client.emit('guildIntegrationsUpdate', event);
      } break;

      case 'GUILD_BAN_ADD': {
        const event = new events.GuildBanAddEvent(this, data.d);
        event.process();

        this.client.emit('guildBanAdd', event);
      } break;

      case 'GUILD_BAN_REMOVE': {
        const event = new events.GuildBanRemoveEvent(this, data.d);
        event.process();

        this.client.emit('guildBanRemove', event);
      } break;

      case 'GUILD_MEMBERS_CHUNK': {
        const event = new events.GuildMemberChunkEvent(this, data.d);
        event.process();

        this.client.emit('guildMembersChunk', event);
      } break;

      case 'GUILD_MEMBER_ADD': {
        const event = new events.GuildMemberAddEvent(this, data.d);
        event.process();

        this.client.emit('guildMemberAdd', event);
      } break;

      case 'GUILD_MEMBER_REMOVE': {
        const event = new events.GuildMemberRemoveEvent(this, data.d);
        event.process();

        this.client.emit('guildMemberRemove', event);
      } break;

      case 'GUILD_MEMBER_UPDATE': {
        const event = new events.GuildMemberUpdateEvent(this, data.d);
        event.process();

        this.client.emit('guildMemberUpdate', event);
      } break;

      case 'GUILD_ROLE_CREATE': {
        const event = new events.GuildRoleCreateEvent(this, data.d);
        event.process();

        this.client.emit('guildRoleCreate', event);
      } break;

      case 'GUILD_ROLE_DELETE': {
        const event = new events.GuildRoleDeleteEvent(this, data.d);
        event.process();

        this.client.emit('guildRoleDelete', event);
      } break;

      case 'GUILD_ROLE_UPDATE': {
        const event = new events.GuildRoleUpdateEvent(this, data.d);
        event.process();

        this.client.emit('guildRoleUpdate', event);
      } break;

      default:
        this.client.emit('raw', data.t, data.d);
        break;
    }
  }

  toString() {
    return `[wumpcord.WebSocketShard<${this.status}, #${this.id}/${this.client.shards.size}>]`;
  }
}
