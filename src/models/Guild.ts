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
/* eslint-disable camelcase */

import GuildVoiceStateManager from '../managers/GuildVoiceStateManager';
import type WebSocketClient from '../gateway/WebSocketClient';
import GuildPresenceManager from '../managers/GuildPresencesManager';
import GuildMemberManager from '../managers/GuildMemberManager';
import GuildEmojiManager from '../managers/GuildEmojiManager';
import { GuildFeature } from '../Constants';
import GuildRoleManager from '../managers/GuildRoleManager';
import GuildIntegration from './guild/GuildIntegration';
import ChannelManager from '../managers/ChannelManager';
import { VoiceState } from './VoiceState';
import GuildPreview from './guild/GuildPreview';
import GuildMember from './guild/GuildMember';
import { Presence } from './presence';
import { Readable } from 'stream';
import { Channel } from './Channel';
import GuildEmoji from './guild/GuildEmoji';
import GuildRole from './guild/GuildRole';
import GuildBan from './guild/GuildBan';
import Webhook from './Webhook';
import Base from './Base';
import Util from '../util';

import type {
  APIGuild,
  APIGuildWelcomeScreen
} from 'discord-api-types';

interface IGuild extends APIGuild {
  shard_id: number;
}

interface PartialPermissionOverwrite {
  allow: number;
  deny: number;
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

interface GuildBanOptions {
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
  nsfw?: string;
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

interface ModifyGuildMemberOptions {
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
  image?: Readable | Buffer;
  name?: string;
}

interface ModifyEmojiOptions {
  roles?: string;
  name?: string;
  id: string;
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
  public banner!: string | null;
  public region!: string;
  public owner!: boolean;
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

  patch(data: IGuild) {
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
      this.owner = data.owner;

    if (data.large !== undefined)
      this.large = data.large;

    if (data.icon !== undefined)
      this.icon = data.icon;

    if (data.name !== undefined)
      this.name = data.name;

    this.shardID = data.shard_id ?? 0;

    if (data.voice_states !== undefined) {
      for (let i = 0; i < data.voice_states.length; i++) {
        const voiceState = data.voice_states[i];
        this.voiceStates.add(new VoiceState(this.client, { guild_id: this.id, ...voiceState }));
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
        this.channels.add(Channel.from(this.client, channel));
      }
    }

    if (data.members !== undefined) {
      for (let i = 0; i < data.members.length; i++) {
        const member = data.members[i];
        this.members.add(new GuildMember(this.client, member));
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
}
