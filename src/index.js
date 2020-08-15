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
 * Returns the initialisation of Wumpcord
 */
module.exports = {
  // Namespaces
  clustering: require('./clustering'),
  commands: require('./commands'),

  // External
  Client: require('./Client'),

  // Utilities
  Constants: require('./util/Constants'),
  Extensions: require('./util/Extensions'),

  // Entities
  Channel: require('./entities/BaseChannel'),
  Guild: require('./entities/BaseGuild'),
  Message: require('./entities/BaseMessage'),
  BotUser: require('./entities/BotUser'),
  GuildMember: require('./entities/GuildMember'),
  Invite: require('./entities/Invite'),
  Presence: require('./entities/Presence'),
  VoiceState: require('./entities/VoiceState'),
  DMChannel: require('./entities/channel/DMChannel'),
  GroupChannel: require('./entities/channel/GroupChannel'),
  GuildChannel: require('./entities/channel/GuildChannel'),
  NewsChannel: require('./entities/channel/NewsChannel'),
  StoreChannel: require('./entities/channel/StoreChannel'),
  TextChannel: require('./entities/channel/TextChannel'),
  GuildAuditLogEntry: require('./entities/guild/GuildAuditLogEntry'),
  GuildIntegration: require('./entities/guild/GuildIntegration'),
  GuildPreview: require('./entities/guild/GuildPreview'),
  MessageMention: require('./entities/message/MessageMention'),
  MessagePromptMenu: require('./entities/message/MessagePromptMenu'),
  MessageReaction: require('./entities/message/MessageReaction'),
  Permission: require('./entities/permissions/Permission'),
  PermissionOverwrite: require('./entities/permissions/PermissionOverwrite'),

  // Other constants
  version: require('../package.json').version
};