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

/**
 * List of strategy types available
 */
export const StrategyTypes = ['etf', 'json'];

/**
 * List of uncoverable connection codes
 */
export const UnrecoverableCodes = [
  1005, // no idea
  4004, // unable to login
  4010, // invalid shard
  4011, // shard has too many guilds (>2500)
  4013, // invalid intents
  4014  // disallowed intents
];

/**
 * Returns the gateway version
 */
export const GatewayVersion = 8;

/**
 * Returns the REST version
 */
export const RestVersion = 8;

/**
 * List of acceptable image formats
 */
export const ImageFormats = [
  'png',
  'jpg',
  'gif',
  'webp',
  'jpeg'
];

/**
 * The `User-Agent` header value in the [[RestClient]]
 */
export const UserAgent = `DiscordBot (https://github.com/auguwu/Wumpcord, v${version})`;

/**
 * CDN url for images, banners, etc
 */
export const CDNUrl = 'https://cdn.discordapp.com';

/**
 * REST API URL for interacting with Discord
 */
export const RestUrl = 'https://discord.com/api';

/**
 * List of webhook types, the first type index at 1, so it's gonna be null
 */
export const WebhookTypes: [first: null, ...rest: string[]] = [null, 'Incoming', 'Channel Following'];

/**
 * List of activity statuses available
 */
export enum ActivityStatus {
  Playing,
  Streaming,
  Listening,
  Watching,
  Custom,
  Competing
}

/**
 * List of OPCodes to send/receive to the gateway
 */
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

/**
 * List of Permissions available
 */
export const Permissions = {
  createInstantInvite:  1n,
  kickMembers:          1n << 1n,
  banMembers:           1n << 2n,
  administrator:        1n << 3n,
  manageChannels:       1n << 4n,
  manageGuild:          1n << 5n,
  addReactions:         1n << 6n,
  viewAuditLogs:        1n << 7n,
  voicePrioritySpeaker: 1n << 8n,
  stream:               1n << 9n,
  readMessages:         1n << 10n,
  sendMessages:         1n << 11n,
  sendTTSMessages:      1n << 12n,
  manageMessages:       1n << 13n,
  embedLinks:           1n << 14n,
  attachFiles:          1n << 15n,
  readMessageHistory:   1n << 16n,
  mentionEveryone:      1n << 17n,
  externalEmojis:       1n << 18n,
  viewGuildInsights:    1n << 19n,
  voiceConnect:         1n << 20n,
  voiceSpeak:           1n << 21n,
  voiceMuteMembers:     1n << 22n,
  voiceDeafenMembers:   1n << 23n,
  voiceMoveMembers:     1n << 24n,
  voiceUseVAD:          1n << 25n,
  changeNickname:       1n << 26n,
  manageNicknames:      1n << 27n,
  manageRoles:          1n << 28n,
  manageWebhooks:       1n << 29n,
  manageEmojis:         1n << 30n,
  useSlashCommands:     1n << 31n,
  stageRequestToSpeak:  1n << 32n,
  stageModerator:       1n << 4n | 1n << 22n | 1n << 24n,
  all:                  BigInt(0b1111111111111111111111111111111),
  allGuild:             BigInt(0b1111100000010000000000010111111),
  allText:              BigInt(0b0110000000001111111110001010001),
  allVoice:             BigInt(0b0110011111100000000001100010001)
} as const;

/**
 * Represents the audit log action type
 */
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

/**
 * Messages flags for [[Message.flags]]
 */
export enum MessageFlags {
  Crossposted = 1 << 0,
  IsCrosspost = 1 << 1,
  SupressEmbed = 1 << 2,
  SourceMessageDeleted = 1 << 3,
  Urgent = 1 << 4
}

/**
 * Message types for [[Message.type]]
 */
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
  GuildDiscoveryRequalified,
  Reply = 19,
  ApplicationCommand
}

/**
 * The channel types as their name
 */
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

/**
 * List of user flags available
 */
export enum UserFlags {
  None,
  Staff           = 1 << 0,
  Partner         = 1 << 1,
  HypesquadEvents = 1 << 2,
  BugHunterLevel1 = 1 << 3,
  Bravery         = 1 << 6,
  Brillance       = 1 << 7,
  Balance         = 1 << 8, // the best house dont @ me <3
  EarlySupporter  = 1 << 9,
  TeamUser        = 1 << 10,
  System          = 1 << 12,
  BugHunterLevel2 = 1 << 14,
  VerifiedBot     = 1 << 16,
  VerifiedBotDev  = 1 << 17
}

/**
 * List of gateway intents for [[ClientOptions.intents]] / [[WebSocketOptions.intents]]
 */
export enum GatewayIntents {
  GUILDS                   = 1 << 0,
  GUILD_MEMBERS            = 1 << 1,
  GUILD_BANS               = 1 << 2,
  GUILD_EMOJIS             = 1 << 3,
  GUILD_INTEGRATIONS       = 1 << 4,
  GUILD_WEBHOOKS           = 1 << 5,
  GUILD_INVITES            = 1 << 6,
  GUILD_VOICE_STATES       = 1 << 7,
  GUILD_PRESENCES          = 1 << 8,
  GUILD_MESSAGES           = 1 << 9,
  GUILD_MESSAGE_REACTIONS  = 1 << 10,
  GUILD_MESSAGE_TYPING     = 1 << 11,
  DIRECT_MESSAGES          = 1 << 12,
  DIRECT_MESSAGE_REACTIONS = 1 << 13,
  DIRECT_MESSAGE_TYPING    = 1 << 14,
  PRIVILEGED               = GUILD_MEMBERS | GUILD_PRESENCES
}

/**
 * List of gateway events from the `Event` payload
 */
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

/**
 * Activity flags
 */
export enum ActivityFlags {
  Instance = 1 << 0,
  Join = 1 << 1,
  Spectate = 1 << 2,
  JoinRequest = 1 << 3,
  Sync = 1 << 4,
  Play = 1 << 5
}

/**
 * List of shard statuses for [[WebSocketShard.status]]
 */
export enum ShardStatus {
  Connected        = 'connected',
  Handshaking      = 'handshaking',
  Nearly           = 'nearly',
  Dead             = 'dead',
  WaitingForGuilds = 'waiting_for_guilds'
}
