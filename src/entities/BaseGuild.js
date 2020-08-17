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

const { Collection } = require('@augu/immutable');
const BaseEntity = require('./BaseEntity');

module.exports = class BaseGuild extends BaseEntity {
  /**
   * Creates a new [BaseGuild]
   * @param {import('../Client')} client The client
   * @param {GuildPacket} data The data
   */
  constructor(client, data) {

  }
};

/**
 * @typedef {object} GuildPacket
 * @prop {number} default_message_notifications The default message notifications level
 * @prop {number} [premium_subscription_count] The number of premium subscriptions in this guild
 * @prop {number} [approximate_presence_count] The amount of precenses avaliable
 * @prop {number} [approximate_member_count] The amount of members avaliable
 * @prop {number} explicit_content_filter The content filter
 * @prop {string} [widget_channel_id] The widget channel ID
 * @prop {string} [system_channel_id] The system channel ID
 * @prop {number} verification_level The verification level
 * @prop {string} embed_channel_id The embed's channel ID?
 * 
 */

/*
export interface GuildPacket extends UnavaliableGuildPacket {
  default_message_notifications: MessageNotificationsLevel;
  premium_subscription_count?: number;
  approximate_presence_count?: number;
  approximate_member_count?: number;
  explicit_content_filter: ExplicitContentFilterLevel;
  widget_channel_id?: string;
  system_channel_id?: string;
  verification_level: VerificationLevel;
  embed_channel_id: string;
  preferred_locale: string;
  application_id?: string;
  vanity_url_code: string;
  embed_enabled?: boolean;
  afk_channel_id: string;  
  widget_enabled: boolean;
  max_presences?: number;
  permissions?: Permissions;
  max_members?: number;
  premium_tier: GuildPremiumTier;
  unavaliable: false;
  afk_timeout: number;  
  description: string; 
  mfa_level: MFALevel;
  features: GuildFeature[];
  owner_id: string;
  channels: GuildChannelPacket[];
  splash?: string;
  members: GuildMemberPacket[];
  emojis: EmojiPacket[];
  region: GuildRegion;
  banner: string;
  roles: RolePacket[];
  icon?: string;
  name: string;
}
*/