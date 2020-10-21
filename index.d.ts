/**
 * Author: August (Chris) <https://floofy.dev>
 * Project: https://github.com/auguwu/Wumpcord
 */

declare module 'wumpcord' {
  import { Collection } from '@augu/immutable';

  /** Main entrypoint of Wumpcord */
  namespace Wumpcord {
    /**
     * The available cache types
     */
    type CacheType = 'guild' | 'user' | 'channel' 
      | 'member' | 'member:role' | 'voice' 
      | 'attachments' | 'overwrites' | 'emoji'
      | 'message' | 'presence' | 'presence:activity'
      | 'typing' | 'invites' | 'voice:connections'
      | 'audit:entries';

    /**
     * Available image formats supported by Discord
     */
    type ImageFormats = 'jpg' | 'png' | 'webp' | 'jpeg' | 'gif';

    /**
     * The commands API allows you to create a bot without creating any external command handler.
     * ```js
     * const { commands } = require('wumpcord'); // CommonJS
     * import { commands } from 'wumpcord'; // ESNext
     * ```
     * 
     * It's based on **discord.js-commando** and acts kinda similar.
     * We have the concept of "TypeReader"s, which basically validates
     * an argument string to return a different value.
     */
    export namespace commands {

    }

    /**
     * The clustering API allows you to fully power the bot using Node.js' internal **cluster**
     * module which will allow you to run the bot under the master process and handle IPC
     * events under a Worker instance. This is useful for huge bots that need to handle
     * load-balancing with different Discord API events.
     */
    export namespace clustering {

    }

    /**
     * The oauth2 API allows you to use Discord's OAuth2 API without the need
     * to re-inventing the wheel yourself. This package includes Express middleware
     * to handle the OAuth2 API requests without "re-inventing the wheel".
     */
    export namespace oauth2 {

    }

    /**
     * Constant variables used through out Wumpcord, this is a namespace
     * but it's a object of stuff combined.
     */
    export namespace Constants {
      /**
       * The available strategy types to encode or decode data to/from Discord
       * 
       * - **etf**
       * - **json**
       */
      export const StrategyTypes: string[];

      /**
       * List of unrecoverable codes and will shutdown the bot
       */
      export const UnrecoverableCodes: number[];

      /**
       * The gateway version we use to authenicate to Discord
       */
      export const GatewayVersion: number;

      /**
       * The cache types that Wumpcord uses to
       * determine if it should be cached or not.
       */
      export const CacheType: Wumpcord.CacheType[];

      /**
       * The image formats used to format an image from Discord's CDN
       */
      export const ImageFormats: Wumpcord.ImageFormats[];

      /**
       * The rest version to use to use the REST API
       */
      export const RestVersion: number;

      /**
       * The User-Agent that Discord needs
       */
      export const UserAgent: string;

      /**
       * The CDN url
       */
      export const CdnUrl: string;

      /**
       * The Rest API url
       */
      export const RestUrl: string;

      /**
       * The endpoints available
       */
      export namespace Endpoints {
        export const Channel: Endpoints.ChannelObject;
        export const Guild: Endpoints.GuildObject;
        export const User: Endpoints.UserObject;
        export const CDN: Endpoints.CDNObject;

        interface ChannelObject {
          bulkDelete(channelID: string): string;
          callRing(channelID: string): string;
          crosspost(channelID: string, messageID: string): string;
          followers(channelID: string): string;
          invites(channelID: string): string;
          messageReaction(channelID: string, messageID: string, reaction: string): string;
          messageReactionUser(channelID: string, messageID: string, reaction: string, userID: string): string;
          messageReactions(channelID: string, messageID: string): string;
          message(channelID: string, messageID: string): string;
          messagesSearch(channelID: string): string;
          permission(channelID: string, permissionID: string): string;
          permissions(channelID: string): string;
          recipient(groupID: string, userID: string): string;
          pin(channelID: string, messageID: string): string;
          pins(channelID: string): string;
          typing(channelID: string): string;
          webhooks(channelID: string): string;
        }

        interface GuildObject {
          auditLogs(guildID: string): string;
        }
      }
    }
  }

  export = Wumpcord;
}

// this is for typings and aaaaaaaaaaaaaaaa
/*
  Endpoints: {
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
    voiceRegions:                    '/voice/regions',
    gateway:                         '/gateway',
    gatewayBot:                      '/gateway/bot',
    channels:                        '/channels',
    channel: (channelID)             => `/channels/${channelID}`,
    webhook: (id)                    => `/webhooks/${id}`,
    invite: (id)                     => `/invite/${id}`,
    guild: (id, withCounts)          => `/guilds/${id}?with_counts=${withCounts ? 'true' : 'false'}`,
    users:                           '/users',
    user: (id)                       => `/users/${id}`
  },

  ActivityStatus: {
    Playing: 0,
    Streaming: 1,
    Listening: 2,
    Custom: 4,
    Competing: 5
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
    createInstantInvite : 1,
    kickMembers         : 1 << 1,
    banMembers          : 1 << 2,
    administrator       : 1 << 3,
    manageChannels      : 1 << 4,
    manageGuild         : 1 << 5,
    addReactions        : 1 << 6,
    viewAuditLogs       : 1 << 7,
    voicePrioritySpeaker: 1 << 8,
    stream              : 1 << 9,
    readMessages        : 1 << 10,
    sendMessages        : 1 << 11,
    sendTTSMessages     : 1 << 12,
    manageMessages      : 1 << 13,
    embedLinks          : 1 << 14,
    attachFiles         : 1 << 15,
    readMessageHistory  : 1 << 16,
    mentionEveryone     : 1 << 17,
    externalEmojis      : 1 << 18,
    viewGuildInsights   : 1 << 19,
    voiceConnect        : 1 << 20,
    voiceSpeak          : 1 << 21,
    voiceMuteMembers    : 1 << 22,
    voiceDeafenMembers  : 1 << 23,
    voiceMoveMembers    : 1 << 24,
    voiceUseVAD         : 1 << 25,
    changeNickname      : 1 << 26,
    manageNicknames     : 1 << 27,
    manageRoles         : 1 << 28,
    manageWebhooks      : 1 << 29,
    manageEmojis        : 1 << 30,
    all                 : 0b1111111111111111111111111111111,
    allGuild            : 0b1111100000010000000000010111111,
    allText             : 0b0110000000001111111110001010001,
    allVoice            : 0b0110011111100000000001100010001
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
    0: 'text',
    1: 'dm',
    2: 'voice',
    3: 'group',
    4: 'category',
    5: 'news',
    6: 'store'
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
  },

  ShardStatus: {
    Connected:        0,
    Connecting:       1,
    Zombie:           2,
    Nearly:           3,
    Disposed:         4,
    Dead:             5,
    WaitingForGuilds: 6
  },

  ActivityTypes: {
    0: 'Playing',
    1: 'Streaming',
    2: 'Listening To',
    3: 'Watching'
  },

  WebhookTypes: [
    // they index at 1 for some reason lol
    null,
    'Incoming',
    'Channel Following'
  ],

  StickerType: {
    0: 'png',
    1: 'apng',
    2: 'lottie'
  }
*/
