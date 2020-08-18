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

const { version } = require('../../package.json');

/**
 * Returns all of the stateful constants of Wumpcord
 */
module.exports = {
  UnrecoverableCodes: [1005, 4004, 4010, 4011, 4012, 4013, 4014],
  MaxGuildsToCluster: 10000,
  GatewayVersion: 6,
  CacheTypes: ['guild', 'user', 'channel', 'member', 'member:role', 'voice:state'],
  ImageFormats: ['png', 'jpg', 'gif', 'webp', 'jpeg'],
  RestVersion: 7,
  UserAgent: `DiscordBot (https://github.com/auguwu/Wumpcord, v${version})`,

  Endpoints: {
    Channel: {
      bulkDelete: (channelID)                                       => `/channels/${channelID}/messages/bulk-delete`,
      callRing: (channelID)                                         => `/channels/${channelID}/call/ring`,
      crosspost: (channelID, messageID)                             => `/channels/${channelID}/${messageID}/crosspost`,
      followers: (channelID)                                        => `/channels/${channelID}/followers`,
      invites: (channelID)                                          => `/channels/${channelID}/invites`,
      messageReaction: (channelID, messageID, reaction)             => `/channels/${channelID}/messages/${messageID}/reactions/${reaction}`,
      messageReactionUser: (channelID, messageID, reaction, userID) => `/channels/${channelID}/${messageID}/reactions/${reaction}/${userID}`,
      messageReactions: (channelID, messageID)                      => `/channels/${channelID}/messages/${messageID}/reactions`,
      message: (channelID, messageID)                               => `/channels/${channelID}/messages/${messageID}`,
      messages: (channelID)                                         => `/channels/${channelID}/messages`,
      messagesSearch: (channelID)                                   => `/channels/${channelID}/messages/search`,
      permission: (channelID, permissionID)                         => `/channels/${channelID}/permissions/${permissionID}`,
      permissions: (channelID)                                      => `/channels/${channelID}/permissions`,
      recipient: (groupID, userID)                                  => `/channels/${groupID}/recipients/${userID}`,
      pin: (channelID, messageID)                                   => `/channels/${channelID}/pins/${messageID}`,
      pins: (channelID)                                             => `/channels/${channelID}/pins`,
      typing: (channelID)                                           => `/channels/${channelID}/typing`,
      webhooks: (channelID)                                         => `/channels/${channelID}/webhooks`
    },
    Guild: {
      auditLogs: (guildID)                    => `/guilds/${guildID}/audit-logs`,
      ban: (guildID, memberID)                => `/guilds/${guildID}/bans/${memberID}`,
      bans: (guildID)                         => `/guilds/${guildID}/bans`,
      channels: (guildID)                     => `/guilds/${guildID}/channels`,
      emoji: (guildID, emojiID)               => `/guilds/${guildID}/emojis/${emojiID}`,
      emojis: (guildID)                       => `/guilds/${guildID}/emojis`,
      integration: (guildID, integrationID)   => `/guilds/${guildID}/integrations/${integrationID}`,
      integrations: (guildID)                 => `/guilds/${guildID}/integrations`,
      invites: (guildID)                      => `/guilds/${guildID}/invites`,
      vanityUrl: (guildID)                    => `/guilds/${guildID}/vanity-url`,
      member: (guildID, memberID)             => `/guilds/${guildID}/members/${memberID}`,
      memberNick: (guildID, memberID)         => `/guilds/${guildID}/members/${memberID}/nick`,
      memberRole: (guildID, memberID, roleID) => `/guilds/${guildID}/members/${memberID}/${roleID}`,
      members: (guildID)                      => `/guilds/${guildID}/members`,
      membersSearch: (guildID)                => `/guilds/${guildID}/members/search`,
      messagesSearch: (guildID)               => `/guilds/${guildID}/messages/search`,
      preview: (guildID)                      => `/guilds/${guildID}/preview`,
      prune: (guildID)                        => `/guilds/${guildID}/prune`,
      role: (guildID, roleID)                 => `/guilds/${guildID}/roles/${roleID}`,
      roles: (guildID)                        => `/guilds/${guildID}/roles`,
      voiceRegions: (guildID)                 => `/guilds/${guildID}/regions`,
      webhooks: (guildID)                     => `/guilds/${guildID}/webhooks`,
      widget: (guildID)                       => `/guilds/${guildID}/widget`
    },
    User: {
      channels: (userID)                 => `/users/${userID}/channels`,
      connections: (userID)              => `/users/${userID}/connections`,
      connection: (userID, platform, id) => `/users/${userID}/${platform}/${id}`,
      guild: (userID, guildID)           => `/users/${userID}/guilds/${guildID}`,
      guilds: (userID)                   => `/users/${userID}/guilds`,
      note: (userID, targetID)           => `/users/${userID}/note/${targetID}`,
      profile: (userID)                  => `/users/${userID}/profile`,
      relationship: (userID, relID)      => `/users/${userID}/relationships/${relID}`,
      settings: (userID)                 => `/users/${userID}/settings`
    },
    CDN: {
      getChannelIcon: (id, icon)   => `/channel-icons/${id}/${icon}`,
      getCustomEmoji: (id)         => `/emojis/${id}`,
      getDefaultAvatar: (discrim)  => `/embed/avatars/${discrim}`,
      getGuildBanner: (id, banner) => `/banners/${id}/${banner}`,
      getGuildIcon: (id, icon)     => `/icons/${id}/${icon}`,
      getGuildSplash: (id, splash) => `/splashes/${id}/${splash}`,
      getUserAvatar: (id, avatar)  => `/avatars/${id}/${avatar}`
    },
    voiceRegions:           '/voice/regions',
    gateway:                '/gateway',
    gatewayBot:             '/gateway/bot',
    channels:               '/channels',
    channel: (channelID) => `/channels/${channelID}`,
    webhook: (id)        => `/webhooks/${id}`,
    invite: (id)         => `/invite/${id}`,
    guild: (id)          => `/guilds/${id}`,
    users:                  '/users',
    user: (id)           => `/users/${id}`
  },

  ActivityStatus: {
    Playing: 0,
    Streaming: 1,
    Listening: 2,
    Watching: 3,
    Custom: 4
  },

  OPCodes: {
    Event: 0,
    Heartbeat: 1,
    Identify: 2,
    StatusUpdate: 3,
    VoiceServerUpdate: 4,
    VoiceServerPing: 5,
    Resume: 6,
    Reconnect: 7,
    GetGuildMembers: 8,
    InvalidSession: 9,
    Hello: 10,
    HeartbeatAck: 11,
    SyncGuild: 12,
    SyncCall: 13
  },

  Permissions: {
    CreateInstantInvite : 1,
    KickMembers         : 1 << 1,
    BanMembers          : 1 << 2,
    Administrator       : 1 << 3,
    ManageChannels      : 1 << 4,
    ManageGuild         : 1 << 5,
    AddReactions        : 1 << 6,
    ViewAuditLogs       : 1 << 7,
    VoicePrioritySpeaker: 1 << 8,
    Stream              : 1 << 9,
    ReadMessages        : 1 << 10,
    SendMessages        : 1 << 11,
    SendTTSMessages     : 1 << 12,
    ManageMessages      : 1 << 13,
    EmbedLinks          : 1 << 14,
    AttachFiles         : 1 << 15,
    ReadMessageHistory  : 1 << 16,
    MentionEveryone     : 1 << 17,
    ExternalEmojis      : 1 << 18,
    ViewGuildInsights   : 1 << 19,
    VoiceConnect        : 1 << 20,
    VoiceSpeak          : 1 << 21,
    VoiceMuteMembers    : 1 << 22,
    VoiceDeafenMembers  : 1 << 23,
    VoiceMoveMembers    : 1 << 24,
    VoiceUseVAD         : 1 << 25,
    ChangeNickname      : 1 << 26,
    ManageNicknames     : 1 << 27,
    ManageRoles         : 1 << 28,
    ManageWebhooks      : 1 << 29,
    ManageEmojis        : 1 << 30,
    All                 : 0b1111111111111111111111111111111,
    AllGuild            : 0b1111100000010000000000010111111,
    AllText             : 0b0110000000001111111110001010001,
    AllVoice            : 0b0110011111100000000001100010001
  },

  AuditLogActions: {
    GuildUpdate:            1,
    ChannelCreate:          10,
    ChannelUpdate:          11,
    ChannelDelete:          12,
    ChannelOverwriteCreate: 13,
    ChannelOverwriteUpdate: 14,
    ChannelOverwriteDelete: 15,
    MemberKick:             20,
    MemberPrune:            21,
    MemberBanAdd:           22,
    MemberBanRemove:        23,
    MemberUpdate:           24,
    MemberRoleUpdate:       25,
    MemberMove:             26,
    MemberDisconnect:       27,
    BotAdd:                 28,
    RoleCreate:             30,
    RoleUpdate:             31,
    RoleDelete:             32,
    InviteCreate:           40,
    InviteUpdate:           41,
    InviteDelete:           42,
    WebhookCreate:          50,
    WebhookUpdate:          51,
    WebhooKDelete:          52,
    EmojiCreate:            60,
    EmojiUpdate:            61,
    EmojiDelete:            62,
    MessageDelete:          72,
    MessageBulkDelete:      73,
    MessagePin:             74,
    MessageUnpin:           75,
    IntegrationCreate:      80,
    IntegrationUpdate:      81,
    IntegrationDelete:      82
  },

  MessageFlags: {
    Crossposted:          1 << 0,
    IsCrosspost:          1 << 1,
    SupressEmbeds:        1 << 2,
    SourceMessageDeleted: 1 << 3,
    Urgent:               1 << 4
  },
  
  MessageTypes: {
    Default:                           0,
    RecipientAdd:                      1,
    RecipientRemove:                   2,
    Call:                              3,
    ChannelNameChange:                 4,
    ChannelIconChange:                 5,
    ChannelPinnedMessage:              6,
    GuildMemberJoin:                   7,
    UserPremiumGuildSubscription:      8,
    UserPremiumGuildSubscriptionTier1: 9,
    UserPremiumGuildSubscriptionTier2: 10,
    UserPremiumGuildSubscriptionTier3: 11,
    ChannelFollowAdd:                  12,
    GuildDiscoveryDisqualified:        15,
    GuildDiscoveryRequalified:         16
  },

  ChannelTypes: {
    Text:     0,
    DM:       1,
    Voice:    2,
    Group:    3,
    Category: 4,
    News:     5,
    Store:    6
  },

  UserFlags: {
    None:            0,
    Staff:           1 << 0,
    Partner:         1 << 1,
    HypesquadEvents: 1 << 2,
    BugHunterLevel1: 1 << 3,
    Bravery:         1 << 6,
    Brilliance:      1 << 7,
    Balance:         1 << 8, // the best dont @ me
    EarlySupported:  1 << 9,
    TeamUser:        1 << 10,
    System:          1 << 12,
    BugHunterLevel2: 1 << 14,
    VerifiedBot:     1 << 16,
    VerifiedBotDev:  1 << 17
  },

  GatewayIntents: {
    guilds:                 1 << 0,
    guildMembers:           1 << 1,
    guildBans:              1 << 2,
    guildEmojis:            1 << 3,
    guildIntegrations:      1 << 4,
    guildWebhooks:          1 << 5,
    guildInvites:           1 << 6,
    guildVoiceStates:       1 << 7,
    guildPresences:         1 << 8,
    guildMessages:          1 << 9,
    guildMessageReactions:  1 << 10,
    guildMessageTyping:     1 << 11,
    directMessages:         1 << 12,
    directMessageReactions: 1 << 13,
    directMessageTyping:    1 << 14
  },

  GatewayEvents: {
    Ready:                      'READY',
    Resumed:                    'RESUMED',
    ChannelCreate:              'CHANNEL_CREATE',
    ChannelUpdate:              'CHANNEL_UPDATE',
    ChannelDelete:              'CHANNEL_DELETE',
    ChannelPinUpdate:           'CHANNEL_PINS_UPDATE',
    GuildCreate:                'GUILD_CREATE',
    GuildUpdate:                'GUILD_UPDATE',
    GuildDelete:                'GUILD_DELETE',
    GuildBanAdd:                'GUILD_BAN_ADD',
    GuildBanRemove:             'GUILD_BAN_REMOVE',
    GuildEmojisUpdate:          'GUILD_EMOJIS_UPDATE',
    GuildIntegrationUpdate:     'GUILD_INTEGRATIONS_UPDATE',
    GuildMemberAdd:             'GUILD_MEMBER_ADD',
    GuildMemberDelete:          'GUILD_MEMBER_REMOVE',
    GuildMemberUpdate:          'GUILD_MEMBER_UPDATE',
    GuildMemberChunk:           'GUILD_MEMBERS_CHUNK',
    GuildRoleCreate:            'GUILD_ROLE_CREATE',
    GuildRoleDelete:            'GUILD_ROLE_DELETE',
    GuildRoleUpdate:            'GUILD_ROLE_UPDATE',
    MessageCreated:             'MESSAGE_CREATE',
    MessageUpdate:              'MESSAGE_UPDATE',
    MessageDelete:              'MESSAGE_DELETE',
    MessageDeleteBulk:          'MESSAGE_DELETE_BULK',
    MessageReactionAdd:         'MESSAGE_REACTION_ADD',
    MessageReactionRemove:      'MESSAGE_REACTION_REMOVE',
    MessageReactionRemoveAll:   'MESSAGE_REACTION_REMOVE_ALL',
    MessageReactionRemoveEmoji: 'MESSAGE_REACTION_REMOVE_EMOJI',
    TypingStart:                'TYPING_START', // why does this exist
    UserUpdate:                 'USER_UPDATE',
    VoiceStateUpdate:           'VOICE_STATE_UPDATE',
    VoiceServerUpdate:          'VOICE_SERVER_UPDATE',
    WebhookUpdate:              'WEBHOOKS_UPDATE',
    PresenceUpdate:             'PRESENCE_UPDATE',
    GiftCodeUpdate:             'GIFT_CODE_UPDATE'
  },

  ActivityFlags: {
    Instance:    1 << 0,
    Join:        1 << 1,
    Spectate:    1 << 2,
    JoinRequest: 1 << 3,
    Sync:        1 << 4,
    Play:        1 << 5
  },

  GuildBoostTier: {
    0: 'None',
    1: 'Tier1',
    2: 'Tier2',
    3: 'Tier3'
  }
};

/**
 * @typedef {'guild' | 'user' | 'channel' | 'member' | 'member:role' | 'voice:state' | 'all' | 'none'} CacheType The cache type
 * @typedef {'guilds' | 'guildMembers' | 'guildBans' | 'guildEmojis' | 'guildIntegrations' | 'guildInvites' | 'guildVoiceStates' | 'guildPresences' | 'guildMessages' | 'guildMessageReactions' | 'directMessages' | 'directMessageTyping' | 'directMessageReactions'} GatewayIntents
 * @typedef {'READY' | 'RESUMED' | 'CHANNEL_CREATE' | 'CHANNEL_UPDATE' | 'CHANNEL_DELETE' | 'CHANNEL_PINS_UPDATE' | 'GUILD_CREATE' | 'GUILD_UPDATE' | 'GUILD_DELETE' | 'GUILD_BAN_ADD' | 'GUILD_BAN_REMOVE' | 'GUILD_EMOJIS_UPDATE' | 'GUILD_INTEGRATIONS_UPDATE' | 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_REMOVE' | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBERS_CHUNK' | 'GUILD_ROLE_CREATE' | 'GUILD_ROLE_DELETE' | 'GUILD_ROLE_UPDATE' | 'MESSAGE_CREATE' | 'MESSAGE_UPDATE' | 'MESSAGE_DELETE' | 'MESSAGE_DELETE_BULK' | 'MESSAGE_REACTION_ADD' | 'MESSAGE_REACTION_REMOVE' | 'MESSAGE_REACTION_REMOVE_ALL' | 'MESSAGE_REACTION_REMOVE_EMOJI' | 'TYPING_START' | 'USER_UPDATE' | 'VOICE_STATE_UPDATE' | 'VOICE_SERVER_UPDATE' | 'WEBHOOKS_UPDATE' | 'PRESENCE_UPDATE' | 'GIFT_CODE_UPDATE'} Event
 */