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

import * as discord from 'discord-api-types';
import * as core from '.';

/**
 * Represents a event that is dispatched by a shard
 * @template D The data type from Discord
 */
declare abstract class Event<D extends object> {
  /** Represents the shard that has dispatched this event */
  public shard: core.WebSocketShard;

  /**
   * Creates a new instance of this [Event]
   * @param shard The shard to dispatch
   */
  constructor(shard: core.WebSocketShard, data: D);
}

// src/events
export class TypingStartEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class UserUpdateEvent extends Event<discord.GatewayUserUpdateDispatchData> {}
export class WebhooksUpdate extends Event<discord.GatewayWebhooksUpdateDispatch> {}

// src/voice
export class VoiceServerUpdateEvent extends Event<discord.GatewayVoiceServerUpdateDispatchData> {}
export class VoiceStateUpdateEvent extends Event<discord.GatewayVoiceStateUpdateDispatchData> {}

// src/presence
export class PresenceUpdateEvent extends Event<discord.GatewayPresenceUpdateDispatchData> {}

// src/message
export class MessageCreateEvent<C extends core.AnyChannel = core.AnyChannel> extends Event<discord.GatewayMessageCreateDispatchData> {}
export class MessageDeleteEvent<C extends core.AnyChannel = core.AnyChannel> extends Event<discord.GatewayMessageDeleteDispatchData> {}
export class MessageUpdateEvent<C extends core.AnyChannel = core.AnyChannel> extends Event<discord.GatewayMessageUpdateDispatchData> {}
export class MessageDeleteBulkEvent<C extends core.AnyChannel = core.AnyChannel> extends Event<discord.GatewayMessageDeleteBulkDispatchData> {}

// src/message/reaction
export class MessageReactionAddEvent extends Event<discord.GatewayMessageReactionAddDispatchData> {}
export class MessageReactionRemoveAllEvent extends Event<discord.GatewayMessageReactionRemoveAllDispatchData> {}
export class MessageReactionRemoveEvent extends Event<discord.GatewayMessageReactionRemoveDispatchData> {}
export class MessageReactionRemoveEmojiEvent extends Event<discord.GatewayMessageReactionRemoveEmojiDispatchData> {}

// src/invites
export class InviteCreateEvent extends Event<discord.GatewayInviteCreateDispatchData> {}
export class InviteDeleteEvent extends Event<discord.GatewayInviteDeleteDispatchData> {}

// src/interaction
export class InteractionCreateEvent extends Event<discord.GatewayTypingStartDispatchData> {}

// src/guild
export class GuildCreateEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildDeleteEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildEmojisUpdateEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildIntegrationsEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildUpdateEvent extends Event<discord.GatewayTypingStartDispatchData> {}

// src/guild/bans
export class GuildBanAddEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildBanRemoveEvent extends Event<discord.GatewayTypingStartDispatchData> {}

// src/guild/member
export class GuildMemberAddEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildMemberRemoveEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildMemberUpdateEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildMemberChunkEvent extends Event<discord.GatewayTypingStartDispatchData> {}

// src/guild/roles
export class GuildRoleCreateEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildRoleDeleteEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class GuildRoleUpdateEvent extends Event<discord.GatewayTypingStartDispatchData> {}

// src/channels
export class ChannelCreateEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class ChannelDeleteEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class ChannelUpdateEvent extends Event<discord.GatewayTypingStartDispatchData> {}
export class ChannelPinsUpdateEvent extends Event<discord.GatewayTypingStartDispatchData> {}
