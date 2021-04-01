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

const { version } = require('../package.json');

/**
 * List of gateway events available
 */
export type GatewayEvent = 'READY' | 'RESUMED' | 'CHANNEL_CREATE' | 'CHANNEL_UPDATE'
  | 'CHANNEL_DELETE' | 'CHANNEL_PINS_UPDATE' | 'GUILD_CREATE' | 'GUILD_UPDATE'
  | 'GUILD_DELETE' | 'GUILD_BAN_ADD' | 'GUILD_BAN_REMOVE' | 'GUILD_EMOJIS_UPDATE'
  | 'GUILD_INTEGRATIONS_UPDATE' | 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_REMOVE'
  | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBERS_CHUNK' | 'GUILD_ROLE_CREATE' | 'GUILD_ROLE_DELETE'
  | 'GUILD_ROLE_UPDATE' | 'MESSAGE_CREATE' | 'MESSAGE_UPDATE' | 'MESSAGE_DELETE'
  | 'MESSAGE_DELETE_BULK' | 'MESSAGE_REACTION_ADD' | 'MESSAGE_REACTION_REMOVE' | 'MESSAGE_REACTION_REMOVE_ALL'
  | 'MESSAGE_REACTION_REMOVE_EMOJI' | 'TYPING_START' | 'USER_UPDATE' | 'VOICE_STATE_UPDATE'
  | 'VOICE_SERVER_UPDATE' | 'WEBHOOKS_UPDATE' | 'PRESENCE_UPDATE' | 'GIFT_CODE_UPDATE'
  | 'INTERACTION_CREATE' | 'APPLICATION_COMMAND_UPDATE';

/**
 * List of guild features available
 */
export type GuildFeature = 'ANIMATED_ICON' | 'BANNER' | 'COMMERECE' | 'COMMUNITY'
  | 'DISCOVERABLE' | 'FEATURABLE' | 'INVITE_SPLASH' | 'NEWS' | 'PARTNERED' | 'RELAY_ENABLED'
  | 'NEWS' | 'PARTNERED' | 'VANITY_URL' | 'VERIFIED' | 'VIP_REGIONS' | 'WELCOME_SCREEN_ENABLED';

/**
 * List of gateway intents available
 */
export type GatewayIntent = 'guilds' | 'guildMembers' | 'guildBans' | 'guildEmojis'
  | 'guildIntegrations' | 'guildInvites' | 'guildVoiceStates' | 'guildPresences'
  | 'guildMessages' | 'guildMessageReactions' | 'directMessages' | 'directMessageTyping'
  | 'directMessageReactions';

export const StrategyTypes = ['etf', 'json'];
export const UnrecoverableCodes = [
  1005, // no idea
  4004, // unable to login
  4010, // invalid shard
  4011, // shard has too many guilds (>2500)
  4013, // invalid intents
  4014  // disallowed intents
];

export const GatewayVersion = 8;
export const RestVersion = 8;
export const ImageFormats = [
  'png',
  'jpg',
  'gif',
  'webp',
  'jpeg'
];

export const UserAgent = `DiscordBot (https://github.com/auguwu/Wumpcord, v${version})`;
export const CDNUrl = 'https://cdn.discordapp.com';
export const RestUrl = 'https://discord.com/api';

// The first type index at 1, so it's gonna be null
export const WebhookTypes: [first: null, ...rest: string[]] = [null, 'Incoming', 'Channel Following'];

export enum ActivityStatus {
  Playing,
  Streaming,
  Listening,
  // 3 is hidden (Watching)
  Custom = 4,
  Competing
}

export enum OPCodes {
  Event,
  Heartbeat,
  Identify,
  StatusUpdate,
  VoiceStateUpdate,
  // 5 is a mystery
  Resume = 6,
  Reconnect,
  GetGuildMembers,
  InvalidSession,
  Hello,
  HeartbeatAck,
  SyncGuild,
  SyncCall
}

export enum Permissions {
  createInstantInvite  = 1,
  kickMembers          = 1 << 1,
  banMembers           = 1 << 2,
  administrator        = 1 << 3,
  manageChannels       = 1 << 4,
  manageGuild          = 1 << 5,
  addReactions         = 1 << 6,
  viewAuditLogs        = 1 << 7,
  voicePrioritySpeaker = 1 << 8,
  stream               = 1 << 9,
  readMessages         = 1 << 10,
  sendMessages         = 1 << 11,
  sendTTSMessages      = 1 << 12,
  manageMessages       = 1 << 13,
  embedLinks           = 1 << 14,
  attachFiles          = 1 << 15,
  readMessageHistory   = 1 << 16,
  mentionEveryone      = 1 << 17,
  externalEmojis       = 1 << 18,
  viewGuildInsights    = 1 << 19,
  voiceConnect         = 1 << 20,
  voiceSpeak           = 1 << 21,
  voiceMuteMembers     = 1 << 22,
  voiceDeafenMembers   = 1 << 23,
  voiceMoveMembers     = 1 << 24,
  voiceUseVAD          = 1 << 25,
  changeNickname       = 1 << 26,
  manageNicknames      = 1 << 27,
  manageRoles          = 1 << 28,
  manageWebhooks       = 1 << 29,
  manageEmojis         = 1 << 30,
  stageRequestToSpeak  = 4294967296,
  all                  = 0b1111111111111111111111111111111,
  allGuild             = 0b1111100000010000000000010111111,
  allText              = 0b0110000000001111111110001010001,
  allVoice             = 0b0110011111100000000001100010001
}

export enum AuditLogAction {
  GuildUpdate = 1,
  ChannelCreate = 10,
  ChannelUpdate = 11,
  ChannelDelete = 12,
  ChannelOverwriteCreate = 13,
  ChannelOverwriteUpdate = 14,
  ChannelOverwriteDelete = 15,
  MemberKick = 20,
  MemberPrune = 21,
  MemberBanAdd = 22,
  MemberBanRemove = 23,
  MemberUpdate = 24,
  MemberRoleUpdate = 25,
  MemberMove = 26,
  MemberDisconnect = 27,
  BotAdd = 28,
  RoleCreate = 30,
  RoleUpdate = 31,
  RoleDelete = 32,
  InviteCreate = 40,
  InviteUpdate = 41,
  InviteDelete = 42,
  WebhookCreate = 50,
  WebhookUpdate = 51,
  WebhookDelete = 52,
  EmojiCreate = 60,
  EmojiUpdate = 61,
  EmojiDelete = 62,
  MessageDelete = 72,
  MessageBulkDelete = 73,
  MessagePin = 74,
  MessageUnpin = 75,
  IntegrationCreate = 80,
  IntegrationUpdate = 81,
  IntegrationDelete = 82
}

export enum MessageFlags {
  Crossposted = 1 << 0,
  IsCrosspost = 1 << 1,
  SupressEmbed = 1 << 2,
  SourceMessageDeleted = 1 << 3,
  Urgent = 1 << 4
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
  GuildDiscoveryDisqualified = 15,
  GuildDiscoveryRequalified
}

export enum ChannelTypes {
  Text,
  DM,
  Voice,
  Group,
  News,
  Store
}

export const ChannelTypesObject = {
  0: 'text',
  1: 'dm',
  2: 'voice',
  3: 'group',
  4: 'category',
  5: 'news',
  6: 'store',
  13: 'stage'
} as const;

export enum UserFlags {
  None,
  Staff = 1 << 0,
  Partner = 1 << 1,
  HypesquadEvents = 1 << 2,
  BugHunterLevel1 = 1 << 3,
  Bravery = 1 << 6,
  Brillance = 1 << 7,
  Balance = 1 << 8, // the best house dont @ me <3
  EarlySupporter = 1 << 9,
  TeamUser = 1 << 10,
  System = 1 << 12,
  BugHunterLevel2 = 1 << 14,
  VerifiedBot = 1 << 16,
  VerifiedBotDev = 1 << 17
}

export enum GatewayIntents {
  guilds                 = 1 << 0,
  guildMembers           = 1 << 1,
  guildBans              = 1 << 2,
  guildEmojis            = 1 << 3,
  guildIntegrations      = 1 << 4,
  guildWebhooks          = 1 << 5,
  guildInvites           = 1 << 6,
  guildVoiceStates       = 1 << 7,
  guildPresences         = 1 << 8,
  guildMessages          = 1 << 9,
  guildMessageReactions  = 1 << 10,
  guildMessageTyping     = 1 << 11,
  directMessages         = 1 << 12,
  directMessageReactions = 1 << 13,
  directMessageTyping    = 1 << 14
}

export enum GatewayEvents {
  Ready                      = 'READY',
  Resumed                    = 'RESUMED',
  ChannelCreate              = 'CHANNEL_CREATE',
  ChannelUpdate              = 'CHANNEL_UPDATE',
  ChannelDelete              = 'CHANNEL_DELETE',
  ChannelPinUpdate           = 'CHANNEL_PINS_UPDATE',
  GuildCreate                = 'GUILD_CREATE',
  GuildUpdate                = 'GUILD_UPDATE',
  GuildDelete                = 'GUILD_DELETE',
  GuildBanAdd                = 'GUILD_BAN_ADD',
  GuildBanRemove             = 'GUILD_BAN_REMOVE',
  GuildEmojisUpdate          = 'GUILD_EMOJIS_UPDATE',
  GuildIntegrationUpdate     = 'GUILD_INTEGRATIONS_UPDATE',
  GuildMemberAdd             = 'GUILD_MEMBER_ADD',
  GuildMemberDelete          = 'GUILD_MEMBER_REMOVE',
  GuildMemberUpdate          = 'GUILD_MEMBER_UPDATE',
  GuildMemberChunk           = 'GUILD_MEMBERS_CHUNK',
  GuildRoleCreate            = 'GUILD_ROLE_CREATE',
  GuildRoleDelete            = 'GUILD_ROLE_DELETE',
  GuildRoleUpdate            = 'GUILD_ROLE_UPDATE',
  MessageCreated             = 'MESSAGE_CREATE',
  MessageUpdate              = 'MESSAGE_UPDATE',
  MessageDelete              = 'MESSAGE_DELETE',
  MessageDeleteBulk          = 'MESSAGE_DELETE_BULK',
  MessageReactionAdd         = 'MESSAGE_REACTION_ADD',
  MessageReactionRemove      = 'MESSAGE_REACTION_REMOVE',
  MessageReactionRemoveAll   = 'MESSAGE_REACTION_REMOVE_ALL',
  MessageReactionRemoveEmoji = 'MESSAGE_REACTION_REMOVE_EMOJI',
  TypingStart                = 'TYPING_START', // why does this exist
  UserUpdate                 = 'USER_UPDATE',
  VoiceStateUpdate           = 'VOICE_STATE_UPDATE',
  VoiceServerUpdate          = 'VOICE_SERVER_UPDATE',
  WebhookUpdate              = 'WEBHOOKS_UPDATE',
  PresenceUpdate             = 'PRESENCE_UPDATE',
  GiftCodeUpdate             = 'GIFT_CODE_UPDATE',
  InteractionCreate          = 'INTERACTION_CREATE',
  ApplicationCommandUpdate   = 'APPLICATION_COMMAND_UPDATE'
}

export enum ActivityFlags {
  Instance = 1 << 0,
  Join = 1 << 1,
  Spectate = 1 << 2,
  JoinRequest = 1 << 3,
  Sync = 1 << 4,
  Play = 1 << 5
}

export enum ShardStatus {
  Connected        = 'connected',
  Handshaking      = 'handshaking',
  Nearly           = 'nearly',
  Dead             = 'dead',
  WaitingForGuilds = 'waiting_for_guilds'
}

export enum StickerType {
  PNG,
  APNG,
  Lottie
}
