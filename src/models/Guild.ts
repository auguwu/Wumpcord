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

import { AuditLogAction, GuildFeature, OPCodes } from '../Constants';
import type { AnyChannel, AnyGuildChannel } from '../types';
import type { GuildMemberChunkEvent } from '../events';
import GuildVoiceStateManager from '../managers/GuildVoiceStateManager';
import type WebSocketClient from '../gateway/WebSocketClient';
import GuildPresenceManager from '../managers/GuildPresencesManager';
import GuildMemberManager from '../managers/GuildMemberManager';
import GuildEmojiManager from '../managers/GuildEmojiManager';
import GuildRoleManager from '../managers/GuildRoleManager';
import GuildIntegration from './guild/GuildIntegration';
import { Collection } from '@augu/collections';
import ChannelManager from '../managers/ChannelManager';
import { VoiceState } from './VoiceState';
import { Presence } from './presence';
import GuildPreview from './guild/GuildPreview';
import { Readable } from 'stream';
import GuildMember from './guild/GuildMember';
import GuildInvite from './guild/GuildInvite';
import { Channel } from './Channel';
import { Webhook } from './Webhook';
import GuildEmoji from './guild/GuildEmoji';
import AuditLogs from './audits/AuditLogs';
import GuildRole from './guild/GuildRole';
import GuildBan from './guild/GuildBan';

import Base from './Base';
import Util from '../util';

import {
  APIEmoji,
  APIGuild,
  APIGuildWelcomeScreen,
  APIRole,
  GatewayRequestGuildMembersData,
  RESTGetAPIAuditLogResult,
  RESTGetAPIGuildBansResult,
  RESTGetAPIGuildChannelsResult,
  RESTGetAPIGuildEmojiResult,
  RESTGetAPIGuildEmojisResult,
  RESTGetAPIGuildInvitesResult,
  RESTGetAPIGuildPreviewResult,
  RESTGetAPIGuildRolesResult,
  RESTGetAPIGuildVoiceRegionsResult,
  RESTGetAPIGuildWebhooksResult,
  RESTPatchAPIGuildChannelPositionsJSONBody,
  RESTPatchAPIGuildEmojiJSONBody,
  RESTPatchAPIGuildJSONBody,
  RESTPatchAPIGuildMemberJSONBody,
  RESTPatchAPIGuildRoleJSONBody,
  RESTPatchAPIGuildRolePositionsJSONBody,
  RESTPostAPIGuildChannelJSONBody,
  RESTPostAPIGuildEmojiJSONBody,
  RESTPostAPIGuildPruneJSONBody,
  RESTPostAPIGuildRoleJSONBody,
  RESTPutAPIGuildBanJSONBody
} from 'discord-api-types';

interface IGuild extends APIGuild {
  shard_id: number;
}

interface PartialPermissionOverwrite {
  allow: string;
  deny: string;
  type: 'role' | 'member';
  id: string;
}

interface FetchGuildMembersOptions {
  presences?: boolean;
  limit?: number;
  query?: any;
  nonce?: string;
  force?: boolean;
  time?: number;
  ids?: string[];
}

export interface GuildBanOptions {
  reason?: string;
  days?: number;
}

interface CreateChannelOptions {
  permissionOverwrites?: PartialPermissionOverwrite[];
  ratelimitPerUser?: number;
  userLimit?: number;
  parentID?: string;
  position?: number;
  bitrate?: number;
  topic?: string;
  nsfw?: boolean;
  type: number;
  name: string;
}

interface ModifyGuildOptions {
  defaultMessageNotifications?: number;
  explicitContentFilter?: number;
  verificationLevel?: number;
  afkChannelTimeout?: number;
  systemChannelID?: string;
  afkChannelID?: string;
  ownerID?: string;
  splash?: string;
  banner?: string;
  region?: string;
  icon?: string;
  name?: string;
}

export interface ModifyGuildMemberOptions {
  channelID?: string;
  roles?: string[];
  deaf?: boolean;
  mute?: boolean;
  nick?: string;
}

interface CreateRoleOptions {
  permissions?: number;
  mentionable?: boolean;
  hoistable?: boolean;
  color?: string | number;
  name?: string;
}

interface GuildPruneOptions {
  computed?: boolean;
  roles?: string[];
  days?: number;
}

interface FetchAuditLogsOptions {
  actionType?: number;
  before?: string;
  limit?: number;
}

interface CreateEmojiOptions {
  roles?: string[];
  image: ImageData;
  name: string;
}

interface ModifyEmojiOptions {
  roles?: string[];
  name?: string;
  id: string;
}

interface ImageData {
  content: Buffer | Readable;
  type?: 'jpg' | 'png' | 'gif';
}

type EditGuildRoleOptions = CreateRoleOptions;

export class Guild extends Base<IGuild> {
  // Properties that are added when constructing FIRST
  public voiceStates: GuildVoiceStateManager;
  public unavailable: false;
  public presences: GuildPresenceManager;
  public channels: ChannelManager;
  public members: GuildMemberManager;
  private client: WebSocketClient;
  public emojis: GuildEmojiManager;
  public roles: GuildRoleManager;

  // Properties added using Guild.patch
  public defaultMessageNotifications!: number;
  public approximatePresenceCount!: number;
  public approximateMemberCount!: number;
  public publicUpdatesChannelID!: string | null;
  public explicitContentFilter!: number;
  public maxVideoChannelUsers!: number;
  public systemChannelFlags!: number;
  public verificationLevel!: number;
  public systemChannelID!: string | null;
  public widgetChannelID!: string | null;
  public discoverySplash!: string | null;
  public preferredLocale!: string;
  public rulesChannelID!: string | null;
  public welcomeScreen!: APIGuildWelcomeScreen;
  public applicationID!: string | null;
  public widgetEnabled!: boolean;
  public vanityURLCode!: string | null;
  public afkChannelID!: string | null;
  public maxPresences!: number | null;
  public memberCount!: number;
  public premiumTier!: number;
  public description!: string | null;
  public afkTimeout!: number;
  public maxMembers!: number;
  public boosters!: number;
  public features!: GuildFeature[];
  public iconHash!: string | null;
  public mfaLevel!: number;
  public joinedAt!: Date;
  public shardID!: number;
  public ownerID!: string;
  public isOwner!: boolean;
  public banner!: string | null;
  public region!: string;
  public large!: boolean;
  public icon!: string | null;
  public name!: string;

  constructor(client: WebSocketClient, data: IGuild) {
    super(data.id);

    this.voiceStates = new GuildVoiceStateManager(client);
    this.unavailable = false; // this is always gonna be falsy or it'll be replaced with wumpcord.UnavailableGuild
    this.presences = new GuildPresenceManager(client);
    this.channels = new ChannelManager(client);
    this.members = new GuildMemberManager(client);
    this.client = client;
    this.emojis = new GuildEmojiManager(client);
    this.roles = new GuildRoleManager(client);

    this.patch(data);
  }

  patch(data: Partial<IGuild>) {
    if (data.default_message_notifications !== undefined)
      this.defaultMessageNotifications = data.default_message_notifications;

    if (data.approximate_presence_count !== undefined)
      this.approximatePresenceCount = data.approximate_presence_count;

    if (data.approximate_member_count !== undefined)
      this.approximateMemberCount = data.approximate_member_count;

    if (data.public_updates_channel_id !== undefined)
      this.publicUpdatesChannelID = data.public_updates_channel_id;

    if (data.explicit_content_filter !== undefined)
      this.explicitContentFilter = data.explicit_content_filter;

    if (data.max_video_channel_users !== undefined)
      this.maxVideoChannelUsers = data.max_video_channel_users;

    if (data.system_channel_flags !== undefined)
      this.systemChannelFlags = data.system_channel_flags;

    if (data.verification_level !== undefined)
      this.verificationLevel = data.verification_level;

    if (data.system_channel_id !== undefined)
      this.systemChannelID = data.system_channel_id;

    if (data.widget_channel_id !== undefined)
      this.widgetChannelID = data.widget_channel_id;

    if (data.discovery_splash !== undefined)
      this.discoverySplash = data.discovery_splash;

    if (data.preferred_locale !== undefined)
      this.preferredLocale = data.preferred_locale;

    if (data.rules_channel_id !== undefined)
      this.rulesChannelID = data.rules_channel_id;

    if (data.welcome_screen !== undefined)
      this.welcomeScreen = data.welcome_screen; // don't need a utility class for this x3

    if (data.application_id !== undefined)
      this.applicationID = data.application_id;

    if (data.widget_enabled !== undefined)
      this.widgetEnabled = data.widget_enabled;

    if (data.vanity_url_code !== undefined)
      this.vanityURLCode = data.vanity_url_code;

    if (data.afk_channel_id !== undefined)
      this.afkChannelID = data.afk_channel_id;

    if (data.max_presences !== undefined)
      this.maxPresences = data.max_presences;

    if (data.member_count !== undefined)
      this.memberCount = data.member_count;

    if (data.premium_tier !== undefined)
      this.premiumTier = data.premium_tier;

    if (data.description !== undefined)
      this.description = data.description;

    if (data.afk_timeout !== undefined)
      this.afkTimeout = data.afk_timeout;

    if (data.max_members !== undefined)
      this.maxMembers = data.max_members;

    if (data.premium_subscription_count !== undefined)
      this.boosters = data.premium_subscription_count;

    if (data.features !== undefined)
      // @ts-ignore same type, who cares :P
      this.features = data.features;

    if (data.icon_hash !== undefined)
      this.iconHash = data.icon_hash;

    if (data.mfa_level !== undefined)
      this.mfaLevel = data.mfa_level;

    if (data.joined_at !== undefined)
      this.joinedAt = new Date(data.joined_at);

    if (data.owner_id !== undefined)
      this.ownerID = data.owner_id;

    if (data.banner !== undefined)
      this.banner = data.banner;

    if (data.region !== undefined)
      this.region = data.region;

    if (data.owner !== undefined)
      this.isOwner = data.owner;

    if (data.large !== undefined)
      this.large = data.large;

    if (data.icon !== undefined)
      this.icon = data.icon;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.shard_id !== undefined)
      this.shardID = data.shard_id;

    if (data.voice_states !== undefined) {
      for (let i = 0; i < data.voice_states.length; i++) {
        const voiceState = data.voice_states[i];
        this.voiceStates.add(new VoiceState({ guild_id: this.id, ...voiceState }));
      }
    }

    if (data.presences !== undefined) {
      for (let i = 0; i < data.presences.length; i++) {
        const presence = data.presences[i];
        this.presences.add(new Presence(this.client, presence));
      }
    }

    if (data.channels !== undefined) {
      for (let i = 0; i < data.channels.length; i++) {
        const channel = data.channels[i];

        this.client.channels.add(Channel.from(this.client, channel));
        this.channels.add(Channel.from(this.client, channel));
      }
    }

    if (data.members !== undefined) {
      for (let i = 0; i < data.members.length; i++) {
        const member = data.members[i];
        this.members.add(new GuildMember(this.client, { guild_id: this.id, ...member }));
      }
    }

    if (data.emojis !== undefined) {
      for (let i = 0; i < data.emojis.length; i++) {
        const emoji = data.emojis[i];
        this.emojis.add(new GuildEmoji(this.client, emoji));
      }
    }

    if (data.roles !== undefined) {
      for (let i = 0; i < data.roles.length; i++) {
        const role = data.roles[i];
        this.roles.add(new GuildRole(this.client, { guild_id: this.id, ...role }));
      }
    }
  }

  get shard() {
    return this.client.shards.get(this.shardID);
  }

  get owner() {
    return this.ownerID !== undefined ? this.client.users.get(this.ownerID) : null;
  }

  fetchMembers({
    presences,
    limit,
    query,
    time,
    nonce,
    force,
    ids
  }: FetchGuildMembersOptions = {
    presences: false,
    limit: this.maxMembers,
    query: '',
    time: 120e3,
    nonce: Date.now().toString(16),
    force: false,
    ids: []
  }) {
    return new Promise<Collection<string, GuildMember>>((resolve, reject) => {
      if (
        this.memberCount === this.members.cache.size &&
        !limit &&
        !presences &&
        !query &&
        !ids &&
        !force
      ) return resolve(this.members.cache);

      if (nonce && nonce.length > 32) return reject(new RangeError('Nonce length was over 32'));
      if (this.shard === undefined) return reject(new Error(`Shard #${this.shardID} doesn't exist...?`));

      this.shard.send<GatewayRequestGuildMembersData>(OPCodes.GetGuildMembers, {
        user_ids: ids,
        presences,
        query: query || '',
        nonce,
        limit: limit || this.maxMembers,
        guild_id: this.id
      });

      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        return reject(new Error(`Unable to fetch guild members in ${time}ms`));
      }, time!);

      const handler = (event: GuildMemberChunkEvent) => {
        timeout.refresh();
        if (event.nonce !== nonce) return;

        this.members.cache = event.members;
        if (limit && event.members.size >= limit) {
          clearTimeout(timeout);
          this.client.removeListener('guildMembersChunk', handler);

          return resolve(event.members);
        }

        clearTimeout(timeout);
        this.client.removeListener('guildMembersChunk', handler);
        return resolve(event.members);
      };

      this.client.on('guildMembersChunk', handler);
    });
  }

  delete() {
    if (this.ownerID !== this.client.user.id)
      throw new TypeError('Bot isn\'t a owner of this guild.');

    return this.client.rest.dispatch({
      endpoint: `/guilds/${this.id}`,
      method: 'DELETE'
    });
  }

  ban(userID: string, opts: GuildBanOptions = {}) {
    const options = Util.merge(opts, { days: 7 });

    if (options.days !== undefined && options.days > 7) throw new TypeError('Message deletion days must range from 0-7 (default: 7)');
    if (options.reason !== undefined) {
      if (typeof options.reason !== 'string') throw new TypeError('`reason` has to be a string');
      if (options.reason === '') throw new TypeError('`reason` can\'t be an empty string');
    }

    return this.client.rest.dispatch<void, RESTPutAPIGuildBanJSONBody>({
      endpoint: `/guilds/${this.id}/bans/${userID}`,
      method: 'PUT',
      data: {
        delete_message_days: options.days,
        reason: options.reason
      }
    });
  }

  unban(userID: string, reason?: string) {
    return this.client.rest.dispatch<void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/bans/${userID}`,
      method: 'DELETE'
    });
  }

  createChannel(opts: CreateChannelOptions) {
    if (typeof opts === 'undefined' || typeof opts !== 'object') throw new TypeError('`opts` is not defiend or it\'s not an object');
    if (!opts.hasOwnProperty('name') || !opts.hasOwnProperty('type')) throw new TypeError('Missing `opts.name` and `opts.type` in Guild#createChannel');

    // type-checking for text channels
    if (opts.type === 0) {
      if (opts.topic) {
        if (typeof opts.topic !== 'string') throw new TypeError('`opts.topic` was not a string');
        if (opts.topic === '' || opts.topic.length < 2 || opts.topic.length > 1024) throw new TypeError('`opts.topic` is empty, or the length is under 2 / over 1024 chars');
      }

      if (opts.ratelimitPerUser) {
        if (typeof opts.ratelimitPerUser !== 'number') throw new TypeError('`opts.ratelimitPerUser` was not a number');
        if (Number.isNaN(opts.ratelimitPerUser)) throw new TypeError('`opts.ratelimitPerUser` was not a number');
        if (opts.ratelimitPerUser < 0 || opts.ratelimitPerUser > 21600) throw new TypeError('`opts.ratelimitPerUser` is under 0 / over 21600');
      }
    } else if (opts.type === 2) { // type checking for voice channels
      if (opts.bitrate) {
        if (typeof opts.bitrate !== 'number') throw new TypeError('`opts.bitrate` was not a number');
        if (Number.isNaN(opts.bitrate)) throw new TypeError('`opts.bitrate` was not a number');
        if (opts.bitrate < 8000 || opts.bitrate > 96000) throw new TypeError('`opts.bitrate` was under 8kbps / over 96kbps');
      }

      if (opts.userLimit) {
        if (typeof opts.userLimit !== 'number') throw new TypeError('`opts.userLimit` was not a number');
        if (Number.isNaN(opts.userLimit)) throw new TypeError('`opts.userLimit` was not a number');
        if (opts.userLimit < 0 || opts.userLimit > 100) throw new TypeError('`opts.userLimit` was under 0 / over 100 users');
      }
    }

    return this.client.rest.dispatch<void, RESTPostAPIGuildChannelJSONBody>({
      endpoint: `/guilds/${this.id}/channels`,
      method: 'POST',
      data: {
        name: opts.name,
        type: opts.type,
        topic: opts.topic,
        bitrate: opts.bitrate,
        user_limit: opts.userLimit,
        ratelimit_per_user: opts.ratelimitPerUser,
        position: opts.position,
        // @ts-ignore fuck off
        permission_overwrites: opts.permissionOverwrites,
        parent_id: opts.parentID,
        nsfw: opts.nsfw || false
      }
    });
  }

  getRegions() {
    return this.client.rest.dispatch<RESTGetAPIGuildVoiceRegionsResult>({
      endpoint: `/guilds/${this.id}/regions`,
      method: 'GET'
    });
  }

  getRegionIds() {
    return this
      .getRegions()
      .then(regions => regions.map(r => r.id));
  }

  getPreview() {
    return this.client.rest.dispatch<RESTGetAPIGuildPreviewResult>({
      endpoint: `/guilds/${this.id}/preview`,
      method: 'GET'
    }).then(data => data !== null ? new GuildPreview(this.client, data) : null);
  }

  getChannels<T extends AnyChannel = AnyChannel>() {
    return this.client.rest.dispatch<RESTGetAPIGuildChannelsResult>({
      endpoint: `/guilds/${this.id}/channels`,
      method: 'GET'
    }).then(channels => channels.map(data => Channel.from(this.client, data)) as unknown as T[]);
  }

  getGuildMember(memberID: string) {
    return this.members.fetch(this.id, memberID);
  }

  getRoles() {
    return this.client.rest.dispatch<RESTGetAPIGuildRolesResult>({
      endpoint: `/guilds/${this.id}/roles`,
      method: 'GET'
    }).then(roles => roles.map(role => this.roles.add(new GuildRole(this.client, { guild_id: this.id, ...role }))));
  }

  getBans() {
    return this.client.rest.dispatch<RESTGetAPIGuildBansResult>({
      endpoint: `/guilds/${this.id}/bans`,
      method: 'GET'
    }).then(bans => bans.map(ban => new GuildBan(this.client, {
      reason: ban.reason ?? undefined,
      user: ban.user
    })));
  }

  getInvites() {
    return this.client.rest.dispatch<RESTGetAPIGuildInvitesResult>({
      endpoint: `/guilds/${this.id}/invites`,
      method: 'GET'
    }).then(invites => invites.map(invite => new GuildInvite(this.client, <any> invite)));
  }

  getAuditLogs(opts: FetchAuditLogsOptions = { limit: 50 }) {
    if (opts && !Util.isObject(opts)) throw new TypeError(`Expected \`object\`, but received ${typeof opts}`);

    if (opts.actionType) {
      if (typeof opts.actionType !== 'number' || Number.isNaN(opts.actionType))
        throw new TypeError(`[opts.actionType] Expected \`number\` but gotten ${typeof opts.actionType === 'number' ? 'not a number' : typeof opts.actionType}`);

      const values = Object.values(AuditLogAction);
      if (!values.includes(opts.actionType))
        throw new TypeError(`Audit log action "${opts.actionType}" doesn't exist`);
    }

    if (opts.limit) {
      if (typeof opts.limit !== 'number') throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.limit}`);

      const int = Number(opts.limit);
      if (isNaN(int)) throw new TypeError(`"${opts.limit}" was not a number`);
      if (int < 0 || int > 100) throw new TypeError(`"${int}" can't go <0 or >100`);
    }

    if (opts.before && typeof opts.before !== 'string') throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.before}`);

    let url = `/guilds/${this.id}/audit-logs`;
    const query = Util.objectToQuery({
      action_type: opts.actionType!,
      before: opts.before!,
      limit: opts.limit!
    });

    if (query !== null) url += query;

    return this.client.rest.dispatch<RESTGetAPIAuditLogResult>({
      endpoint: url,
      method: 'GET'
    }).then(data => new AuditLogs(this.client, data));
  }

  getEmojis() {
    return this.client.rest.dispatch<RESTGetAPIGuildEmojisResult>({
      endpoint: `/guilds/${this.id}/emojis`,
      method: 'GET'
    }).then(data =>
      data.map(emoji => this.emojis.add(new GuildEmoji(this.client, { guild_id: this.id, ...emoji })))
    );
  }

  getEmoji(id: string) {
    return this.client.rest.dispatch<RESTGetAPIGuildEmojiResult>({
      endpoint: `/guilds/${this.id}/emojis/${id}`,
      method: 'GET'
    }).then(data => this.emojis.add(new GuildEmoji(this.client, { guild_id: this.id, ...data })));
  }

  getWebhooks() {
    return this.client.rest.dispatch<RESTGetAPIGuildWebhooksResult>({
      endpoint: `/guilds/${this.id}/webhooks`,
      method: 'GET'
    }).then(data => data.map(webhook => new Webhook(this.client, webhook)));
  }

  async modify(opts: ModifyGuildOptions) {
    if (!opts) throw new TypeError('Missing options object, refer to the documentation: https://docs.augu.dev/Wumpcord/Types/EditGuildOptions');
    if (!Object.keys(opts).length) throw new TypeError('Must include something to update');

    // Throw an error if this is a WIP
    if (opts.icon) throw new Error('This option isn\'t available in this context');
    const regions = await this.getRegionIds();

    // now it's time for checking the object for incoinsisent data
    // this is where the part I want to kill myself but hey
    // I like pain so like \o/
    if (opts.name && typeof opts.name !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof opts.name}`);
    if (opts.ownerID && typeof opts.ownerID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.ownerID}`);
    if (opts.afkChannelID && typeof opts.afkChannelID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.afkChannelID}`);
    if (opts.systemChannelID && typeof opts.systemChannelID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.systemChannelID}`);
    if (opts.afkChannelTimeout && (typeof opts.afkChannelTimeout !== 'number' || Number.isNaN(opts.afkChannelID))) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.afkChannelID}`);

    if (opts.splash) {
      if (!this.features.includes('INVITE_SPLASH')) throw new TypeError(`Guild "${this.name}" doesn't have the INVITE_SPLASH feature`);
      throw new TypeError('`splash` in `opts` is not available in this context.');
    }

    if (opts.banner) {
      if (!this.features.includes('BANNER')) throw new TypeError(`Guild "${this.name}" doesn't have the BANNER feature`);
      throw new TypeError('`banner` in `opts` is not available in this context.');
    }

    if (opts.region) {
      if (typeof opts.region !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof opts.region}`);
      if (!regions.includes(opts.region)) throw new TypeError(`Region "${opts.region}" wasn't a valid region (${regions.join(', ')})`);
    }

    if (opts.verificationLevel) {
      if (typeof opts.verificationLevel !== 'number' || Number.isNaN(opts.verificationLevel)) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.verificationLevel}`);
      if (opts.verificationLevel < 0) throw new TypeError('Verification Level must be higher or equal to 5');
      if (opts.verificationLevel > 5) throw new TypeError('Verification Level must be lower or equal to 5');
    }

    if (opts.defaultMessageNotifications) {
      if (typeof opts.defaultMessageNotifications !== 'number' || Number.isNaN(opts.defaultMessageNotifications)) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.defaultMessageNotifications}`);
      if (opts.defaultMessageNotifications < 0) throw new TypeError('Default Message Notifications must be higher or equal to 1');
      if (opts.defaultMessageNotifications > 1) throw new TypeError('Default Message Notifications must be lower or equal to 1');
    }

    if (opts.explicitContentFilter) {
      if (typeof opts.explicitContentFilter !== 'number' || Number.isNaN(opts.explicitContentFilter)) throw new TypeError(`Expected \`number\`, but gotten ${typeof opts.explicitContentFilter}`);
      if (opts.explicitContentFilter < 0) throw new TypeError('Explicit Content Filter must be higher or equal to 2');
      if (opts.explicitContentFilter > 2) throw new TypeError('Explicit Content Filter must be lower or equal to 2');
    }

    return this.client.rest.dispatch<APIGuild, RESTPatchAPIGuildJSONBody>({
      endpoint: `/guilds/${this.id}`,
      method: 'PATCH',
      data: {
        default_message_notifications: opts.defaultMessageNotifications,
        explicit_content_filter: opts.explicitContentFilter,
        system_channel_id: opts.systemChannelID,
        afk_channel_id: opts.afkChannelID,
        afk_timeout: opts.afkChannelTimeout,
        owner_id: opts.ownerID,
        region: opts.region,
        name: opts.name
      }
    }).then(data => {
      this.patch({ ...data });
      return this;
    });
  }

  async modifyChannelPosition(id: string, pos: number) {
    if (!id || !pos) throw new TypeError('Missing `id` or `pos` properties');
    if (typeof id !== 'string') throw new TypeError(`Expected \`string\`, gotten ${typeof id}`);
    if (typeof pos !== 'number' || Number.isNaN(pos)) throw new TypeError(`Expected \`number\`, gotten ${typeof pos}`);

    const channels = await this.getChannels<AnyGuildChannel>();
    const channel = channels.find(chan => chan.id === id);

    if (!channel || !['text', 'voice', 'category', 'news', 'store'].includes(channel.type)) throw new TypeError(`Channel "${id}" doesn't exist or the type isn't text, voice, category, news, or store`);
    if (channel.position === pos) return Promise.resolve();

    const min = Math.min(pos, channel.position);
    const max = Math.max(pos, channel.position);
    const sorted = channels.filter(chan =>
      chan.type === channel.type
        && min <= chan.position
        && chan.position <= max
        && chan.id !== id
    ).sort((chan1, chan2) => chan1.position - chan2.position);

    if (pos > channel.position) {
      sorted.push(channel);
    } else {
      sorted.unshift(channel);
    }

    return this.client.rest.dispatch<void, RESTPatchAPIGuildChannelPositionsJSONBody>({
      endpoint: `/guilds/${this.id}/channels`,
      method: 'PATCH',
      data: sorted.map((channel, index) => ({
        position: index + min,
        id: channel.id
      }))
    });
  }

  async modifyMember(
    memberID: string,
    opts: ModifyGuildMemberOptions,
    reason?: string
  ) {
    const member = this.members.get(memberID);
    if (member === undefined || member === null)
      throw new TypeError(`Member "${memberID}" doesn't exist in guild ${this.name}`);

    if (opts.nick && typeof opts.nick !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.nick}`);
    if (opts.mute && typeof opts.mute !== 'boolean') throw new TypeError(`Expected \`boolean\`, but gotten ${typeof opts.mute}`);
    if (opts.deaf && typeof opts.deaf !== 'boolean') throw new TypeError(`Expected \`boolean\`, but gotten ${typeof opts.deaf}`);
    if (opts.roles) {
      if (!Array.isArray(opts.roles)) throw new TypeError(`Expected \`array\`, but gotten ${typeof opts.roles}`);
      if (opts.roles.some(roleID => typeof roleID !== 'string')) {
        const roles = opts.roles.filter(roleID => typeof roleID !== 'string');
        throw new TypeError(`${roles.length} roles were not a string`);
      }
    }

    if (opts.channelID && typeof opts.channelID !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof opts.channelID}`);

    return this.client.rest.dispatch<void, RESTPatchAPIGuildMemberJSONBody>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/members/${member.id}`,
      method: 'PATCH',
      data: {
        channel_id: opts.channelID,
        roles: opts.roles,
        mute: opts.mute,
        deaf: opts.deaf,
        nick: opts.nick
      }
    });
  }

  async addRole(memberID: string, roleID: string, reason?: string) {
    const member = this.members.get(memberID);
    const role = this.roles.get(roleID);

    if (!member) throw new TypeError(`Member "${memberID}" was not found in this guild`);
    if (!role) throw new TypeError(`Role "${roleID}" doesn't exist in this guild`);

    return this.client.rest.dispatch<void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/members/${member.id}/${role.id}`,
      method: 'PUT'
    });
  }

  async removeRole(memberID: string, roleID: string, reason?: string) {
    const member = this.members.get(memberID);
    const role = this.roles.get(roleID);

    if (!member) throw new TypeError(`Member "${memberID}" was not found in this guild`);
    if (!role) throw new TypeError(`Role "${roleID}" doesn't exist in this guild`);

    return this.client.rest.dispatch<void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/members/${member.id}/${role.id}`,
      method: 'DELETE'
    });
  }

  async kickMember(memberID: string, reason?: string) {
    const member = this.members.get(memberID);
    if (member === undefined || member === null)
      throw new TypeError(`Member "${memberID}" doesn't exist in guild ${this.name}`);

    return this.client.rest.dispatch<void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/members/${member.id}`,
      method: 'DELETE'
    });
  }

  createRole(opts: CreateRoleOptions) {
    if (!opts) throw new TypeError('Missing `opts` object');
    if (!Util.isObject(opts)) return new TypeError(`Expected \`object\`, but received ${typeof opts}`);

    if (opts.name && typeof opts.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof opts.name}`);
    if (opts.color && (typeof opts.color !== 'number' || typeof opts.color !== 'string')) throw new TypeError(`Expected \`string\` or \`number\`, but received ${typeof opts.color}`);
    if (opts.hoistable && typeof opts.hoistable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.hoistable}`);
    if (opts.mentionable && typeof opts.mentionable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.mentionable}`);
    if (opts.permissions && typeof opts.permissions !== 'number') throw new TypeError(`Expected \`number\`, but recieved ${typeof opts.permissions}`);

    let color!: number;
    if (opts.color) {
      if (typeof opts.color === 'string') {
        color = parseInt(opts.color.replace('#', ''), 16);
      } else {
        color = opts.color;
      }
    }

    return this.client.rest.dispatch<APIRole, RESTPostAPIGuildRoleJSONBody>({
      endpoint: `/guilds/${this.id}/roles`,
      method: 'POST',
      data: {
        permissions: String(opts.permissions),
        mentionable: opts.mentionable,
        color,
        hoist: opts.hoistable,
        name: opts.name
      }
    }).then(role => this.roles.add(new GuildRole(this.client, { guild_id: this.id, ...role })));
  }

  deleteRole(roleID: string, reason?: string) {
    return this.client.rest.dispatch<void>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/roles/${roleID}`,
      method: 'DELETE'
    });
  }

  modifyRole(roleID: string, opts: EditGuildRoleOptions, reason?: string) {
    if (!opts) throw new TypeError('Missing `opts` object');
    if (!Util.isObject(opts)) return new TypeError(`Expected \`object\`, but received ${typeof opts}`);

    if (opts.name && typeof opts.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof opts.name}`);
    if (opts.color && (typeof opts.color !== 'number' || typeof opts.color !== 'string')) throw new TypeError(`Expected \`string\` or \`number\`, but received ${typeof opts.color}`);
    if (opts.hoistable && typeof opts.hoistable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.hoistable}`);
    if (opts.mentionable && typeof opts.mentionable !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof opts.mentionable}`);
    if (opts.permissions && typeof opts.permissions !== 'number') throw new TypeError(`Expected \`number\`, but recieved ${typeof opts.permissions}`);

    let color!: number;
    if (opts.color) {
      if (typeof opts.color === 'string') {
        color = parseInt(opts.color.replace('#', ''), 16);
      } else {
        color = opts.color;
      }
    }

    return this.client.rest.dispatch<APIRole, RESTPatchAPIGuildRoleJSONBody>({
      auditLogReason: reason,
      endpoint: `/guilds/${this.id}/roles/${roleID}`,
      method: 'PATCH',
      data: {
        permissions: String(opts.permissions),
        mentionable: opts.mentionable,
        color,
        hoist: opts.hoistable,
        name: opts.name
      }
    });
  }

  async modifyRolePosition(roleID: string, pos: number) {
    const roles = await this.getRoles();
    const role = roles.find(role => role.id === roleID);

    if (!role) throw new TypeError(`Role with ID "${roleID}" was not found`);
    if (role.position === pos) return Promise.resolve();

    const min = Math.min(pos, role.position);
    const max = Math.max(pos, role.position);
    const sorted = roles.filter(role =>
      min <= role.position &&
      role.position <= max &&
      role.id !== roleID
    ).sort((role1, role2) => role1.position - role2.position);

    if (pos > role.position) {
      sorted.push(role);
    } else {
      sorted.unshift(role);
    }

    return this.client.rest.dispatch<void, RESTPatchAPIGuildRolePositionsJSONBody>({
      endpoint: `/guilds/${this.id}/roles`,
      method: 'PATCH',
      data: sorted.map((role, index) => ({
        position: index + min,
        id: role.id,
      }))
    });
  }

  prune(opts?: GuildPruneOptions) {
    const options = Util.merge(opts, { days: 7 })!;

    if (options.computed && typeof options.computed !== 'boolean') throw new TypeError(`Expected \`boolean\`, but received ${typeof options.computed}`);
    if (options.roles) {
      if (!Array.isArray(options.roles)) throw new TypeError(`Expected \`array\`, but received ${typeof options.roles}`);
      if (options.roles.some(role => typeof role !== 'string')) {
        const roles = options.roles.filter(role => typeof role !== 'string');
        throw new TypeError(`${roles.length} roles weren't a string`);
      }
    }

    return this.client.rest.dispatch<void, RESTPostAPIGuildPruneJSONBody>({
      endpoint: `/guilds/${this.id}/prune`,
      method: 'POST',
      data: {
        compute_prune_count: options.computed,
        include_roles: options.roles,
        days: options.days
      }
    });
  }

  async createEmoji(options: CreateEmojiOptions) {
    if (!options) throw new TypeError('Missing `options` object');
    if (!Util.isObject(options)) throw new TypeError(`Expecting \`object\`, but received ${typeof options === 'object' ? 'array' : options}`);
    if (Object.keys(options).length === 0) throw new TypeError('No keys were provided to create an emoji.');

    if (!options.name || !options.image)
      throw new TypeError('[options] Requires \'name\' and \'image\'');

    if (options.name && typeof options.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.name}`);
    if (options.roles && !Array.isArray(options.roles)) throw new TypeError(`Expected \`array\`, but received ${typeof options.roles}`);
    if (options.image && (!Util.isReadableStream(options.image.content) || !Buffer.isBuffer(options.image.content)))
      throw new TypeError(`[options.image] Expected a readable stream or \`Buffer\`, gotten ${typeof options}`);

    let image: Buffer | undefined = undefined;
    if (Util.isReadableStream(options.image.content)) {
      image = await Util.readableToBuffer(options.image.content);
    } else {
      image = options.image.content;
    }

    return this.client.rest.dispatch<APIEmoji, RESTPostAPIGuildEmojiJSONBody>({
      endpoint: `/guilds/${this.id}/emojis`,
      method: 'POST',
      data: {
        roles: options.roles,
        image: Util.bufferToBase64(image, options.image?.type ?? 'png'),
        name: options.name
      }
    });
  }

  modifyEmoji(options: ModifyEmojiOptions) {
    if (!options) throw new TypeError('Missing `options` object');
    if (!Util.isObject(options)) throw new TypeError(`Expecting \`object\`, but received ${typeof options === 'object' ? 'array' : options}`);
    if (!options.id) throw new TypeError('Missing the emoji\'s ID.');
    if (Object.keys(options).length === 0) throw new TypeError('No keys were provided to modify an emoji.');
    if (typeof options.id !== 'string') throw new TypeError(`Expected \`string\`, but gotten ${typeof options.id}`);
    if (options.name && typeof options.name !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.name}`);
    if (options.roles && !Array.isArray(options.roles)) throw new TypeError(`Expected \`array\`, but received ${typeof options.roles}`);

    return this.client.rest.dispatch<APIEmoji, RESTPatchAPIGuildEmojiJSONBody>({
      endpoint: `/guilds/${this.id}/emojis/${options.id}`,
      method: 'PATCH',
      data: {
        roles: options.roles,
        name: options.name
      }
    });
  }

  deleteEmoji(id: string) {
    return this.client.rest.dispatch<void>({
      endpoint: `/guilds/${this.id}/emojis/${id}`,
      method: 'DELETE'
    });
  }

  toString() {
    return `[wumpcord.Guild<${this.name}>]`;
  }
}
