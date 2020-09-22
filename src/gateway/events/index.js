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

/**
 * List of gateway events
 * @type {{ [x in import('../../Constants').Event]: EventCallee }}
 */
module.exports = {
  GUILD_MEMBER_REMOVE: require('./guild/member/GuildMemberRemove'),
  GUILD_MEMBERS_CHUNK: require('./guild/member/GuildMemberChunk'),
  GUILD_MEMBER_UPDATE: require('./guild/member/GuildMemberUpdate'),
  CHANNEL_PINS_UPDATE: require('./channel/ChannelPinsUpdate'),
  GUILD_BAN_REMOVE: require('./guild/bans/GuildBanRemove'),
  GUILD_MEMBER_ADD: require('./guild/member/GuildMemberAdd'),
  PRESENCE_UPDATE: require('./PresenceUpdate'),
  MESSAGE_CREATE: require('./message/MessageCreate'),
  MESSAGE_DELETE: require('./message/MessageDelete'),
  MESSAGE_UPDATE: require('./message/MessageUpdate'),
  CHANNEL_CREATE: require('./channel/ChannelCreate'),
  CHANNEL_DELETE: require('./channel/ChannelDelete'),
  CHANNEL_UPDATE: require('./channel/ChannelUpdate'),
  GUILD_BAN_ADD: require('./guild/bans/GuildBanAdd'),
  GUILD_DELETE: require('./guild/GuildDelete'),
  GUILD_CREATE: require('./guild/GuildCreate'),
  GUILD_UPDATE: require('./guild/GuildUpdate'),
  RESUMED: require('./Resumed'),
  READY: require('./Ready')
};

/**
 * @typedef {(this: import('../WebSocketShard'), data: any) => void} EventCallee The event caller
 */
