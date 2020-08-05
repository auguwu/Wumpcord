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

/** The maximum amount of guilds until the library tells you to use the [clustering.ClusterClient] */
export const MAX_GUILDS_TO_CLUSTER = 10000;

/** The version of the library */
export const version: string = require('../../package.json').version;

/** The user-agent for Discord */
export const USER_AGENT = `DiscordBot (https://github.com/auguwu/Wumpcord, ${version})`;

/** List of image formats to use */
export const ImageFormats = ['png', 'jpg', 'gif', 'webp', 'jpeg'];

/** The gateway version to use */
export const GatewayVersion = 6;

/** the API version to use */
export const RestVersion = 7;

/** Close codes can't be recovered when reconnecting */
export const UnrecoverableCodes = [1005, 4004, 4010, 4011, 4012, 4013, 4014];

/** The list of activities to use (refer to `ClientUser#setStatus`) */
export enum ActivityStatus {
  PLAYING,
  STREAMING,
  LISTENING,
  WATCHING,
  CUSTOM
}

export enum CacheType {
  GUILDS = 1 << 1,
  USERS = 1 << 2,
  CHANNELS = 1 << 3,
  PRESENCES = 1 << 4
}

export enum OPCodes {
  Event,
  Heartbeat,
  Identify,
  StatusUpdate,
  VoiceStateUpdate,
  VoiceServerPing,
  Resume,
  Reconnect,
  GetGuildMembers,
  InvalidSession,
  Hello,
  HeartbeatAck,
  SyncGuild,
  SyncCall
}

export enum Permissions {
  CreateInstantInvite  = 1,
  KickMembers          = 1 << 1,
  BanMembers           = 1 << 2,
  Administrator        = 1 << 3,
  ManageChannels       = 1 << 4,
  ManageGuild          = 1 << 5,
  AddReactions         = 1 << 6,
  ViewAuditLogs        = 1 << 7,
  VoicePrioritySpeaker = 1 << 8,
  Stream               = 1 << 9,
  ReadMessages         = 1 << 10,
  SendMessages         = 1 << 11,
  SendTTSMessages      = 1 << 12,
  ManageMessages       = 1 << 13,
  EmbedLinks           = 1 << 14,
  AttachFiles          = 1 << 15,
  ReadMessageHistory   = 1 << 16,
  MentionEveryone      = 1 << 17,
  ExternalEmojis       = 1 << 18,
  ViewGuildInsights    = 1 << 19,
  VoiceConnect         = 1 << 20,
  VoiceSpeak           = 1 << 21,
  VoiceMuteMembers     = 1 << 22,
  VoiceDeafenMembers   = 1 << 23,
  VoiceMoveMembers     = 1 << 24,
  VoiceUseVAD          = 1 << 25,
  ChangeNickname       = 1 << 26,
  ManageNicknames      = 1 << 27,
  ManageRoles          = 1 << 28,
  ManageWebhooks       = 1 << 29,
  ManageEmojis         = 1 << 30,
  All                  = 0b1111111111111111111111111111111,
  AllGuild             = 0b1111100000010000000000010111111,
  AllText              = 0b0110000000001111111110001010001,
  AllVoice             = 0b0110011111100000000001100010001
}

export enum AuditLogActions {
  GuildUpdate            = 1,
  ChannelCreate          = 10,
  ChannelUpdate          = 11,
  ChannelDelete          = 12,
  ChannelOverwriteCreate = 13,
  ChannelOverwriteUpdate = 14,
  ChannelOverwriteDelete = 15,
  MemberKick             = 20,
  MemberPrune            = 21,
  MemberBanAdd           = 22,
  MemberBanRemove        = 23,
  MemberUpdate           = 24,
  MemberRoleUpdate       = 25,
  MemberMove             = 26,
  MemberDisconnect       = 27,
  BotAdd                 = 28,
  RoleCreate             = 30,
  RoleUpdate             = 31,
  RoleDelete             = 32,
  InviteCreate           = 40,
  InviteUpdate           = 41,
  InviteDelete           = 42,
  WebhookCreate          = 50,
  WebhookUpdate          = 51,
  WebhooKDelete          = 52,
  EmojiCreate            = 60,
  EmojiUpdate            = 61,
  EmojiDelete            = 62,
  MessageDelete          = 72,
  MessageBulkDelete      = 73,
  MessagePin             = 74,
  MessageUnpin           = 75,
  IntegrationCreate      = 80,
  IntegrationUpdate      = 81,
  IntegrationDelete      = 82
}

export enum MessageFlags {
  Crossposted          = 1 << 0,
  IsCrosspost          = 1 << 1,
  SuppresEmbeds        = 1 << 2,
  SourceMessageDeleted = 1 << 3,
  Urgent               = 1 << 4
}

export enum MessageTypes {
  Default,
  RecipientAdd,
  RecipientRemove,
  Call,
  ChannelNameChange,
  ChannelIconChange,
  ChannelPinnedMessage,
  GuildMemberJoin,
  UserPremiumGuildSubscription,
  UserPremiumGuildSubscriptionTier1,
  UserPremiumGuildSubscriptionTier2,
  UserPremiumGuildSubscriptionTier3,
  ChannelFollowAdd,
  GuildDiscoveryDisqualified = 14,
  GuildDiscoveryRequalified = 15
}

export enum ChannelTypes {
  Text,
  DM,
  Voice,
  Group,
  Category,
  News,
  Store
}

export enum UserFlags { 
  None,
  Staff           = 1 << 0,
  Partner         = 1 << 1,
  HypesquadEvents = 1 << 2,
  BugHunterLevel1 = 1 << 3,
  Bravery         = 1 << 6,
  Brilliance      = 1 << 7,
  Balance         = 1 << 8, // the best dont @ me
  EarlySupported  = 1 << 9,
  TeamUser        = 1 << 10,
  System          = 1 << 12,
  BugHunterLevel2 = 1 << 14,
  VerifiedBot     = 1 << 16,
  VerifiedBotDev  = 1 << 17
}

export enum GatewayIntents {
  Guilds                 = 1 << 0,
  GuildMembers           = 1 << 1,
  GuildBans              = 1 << 2,
  GuildEmojis            = 1 << 3,
  GuildIntegrations      = 1 << 4,
  GuildWebhooks          = 1 << 5,
  GuildInvites           = 1 << 6,
  GuildVoiceStates       = 1 << 7,
  GuildPresences         = 1 << 8,
  GuildMessages          = 1 << 9,
  GuildMessageReactions  = 1 << 10,
  GuildMessageTyping     = 1 << 11,
  DirectMessages         = 1 << 12,
  DirectMessageReactions = 1 << 13,
  DirectMessageTyping    = 1 << 14
}

export enum EventType {
  Ready                    = 'READY',
  Resumed                  = 'RESUMED',
  ChannelCreate            = 'CHANNEL_CREATE',
  ChannelUpdate            = 'CHANNEL_UPDATE',
  ChannelDelete            = 'CHANNEL_DELETE',
  ChannelPinUpdate         = 'CHANNEL_PINS_UPDATE',
  GuildCreate              = 'GUILD_CREATE',
  GuildUpdate              = 'GUILD_UPDATE',
  GuildDelete              = 'GUILD_DELETE',
  GuildBanAdd              = 'GUILD_BAN_ADD',
  GuildBanRemove           = 'GUILD_BAN_REMOVE',
  GuildEmojisUpdate        = 'GUILD_EMOJIS_UPDATE',
  GuildIntegrationUpdate   = 'GUILD_INTEGRATIONS_UPDATE',
  GuildMemberAdd           = 'GUILD_MEMBER_ADD',
  GuildMemberDelete        = 'GUILD_MEMBER_REMOVE',
  GuildMemberUpdate        = 'GUILD_MEMBER_UPDATE',
  GuildMemberChunk         = 'GUILD_MEMBERS_CHUNK',
  GuildRoleCreate          = 'GUILD_ROLE_CREATE',
  GuildRoleDelete          = 'GUILD_ROLE_DELETE',
  GuildRoleUpdate          = 'GUILD_ROLE_UPDATE',
  MessageCreated           = 'MESSAGE_CREATE',
  MessageUpdate            = 'MESSAGE_UPDATE',
  MessageDelete            = 'MESSAGE_DELETE',
  MessageDeleteBulk        = 'MESSAGE_DELETE_BULK',
  MessageReactionAdd       = 'MESSAGE_REACTION_ADD',
  MessageReactionRemove    = 'MESSAGE_REACTION_REMOVE',
  MessageReactionRemoveAll = 'MESSAGE_REACTION_REMOVE_ALL',
  TypingStart              = 'TYPING_START', // why does this exist
  UserUpdate               = 'USER_UPDATE',
  VoiceStateUpdate         = 'VOICE_STATE_UPDATE',
  VoiceServerUpdate        = 'VOICE_SERVER_UPDATE',
  WebhookUpdate            = 'WEBHOOKS_UPDATE',
  PresenceUpdate           = 'PRESENCE_UPDATE',
  GiftCodeUpdate           = 'GIFT_CODE_UPDATE'
}