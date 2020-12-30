/**
 * Copyright (c) 2020 August, Ice
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

import type { APIGuildPreview, GuildFeature } from 'discord-api-types';
import type WebSocketClient from '../../gateway/WebSocketClient';
import { CDNUrl } from '../../Constants';
import GuildEmoji from './GuildEmoji';
import Base from '../Base';

export default class GuildPreview extends Base<APIGuildPreview> {
  /** Number of online members */
  public approximatePresenceCount!: number;

  /** Number of all members in the guild */
  public approximateMemberCount!: number;

  /** The discovery splash UUID, is `null` if not populated */
  public discoverySplash!: string | null;

  /** The description of the guild preview */
  public description!: string;

  /** List of features that is enabled in the guild */
  public features!: GuildFeature[];

  /** The splash UUID, it's `null` if not populated */
  public splash!: string | null;
  private client: WebSocketClient;

  /** List of guild emojis available when displayed */
  public emojis!: GuildEmoji[];

  /** The icon UUID, returns `null` if not populated */
  public icon!: string | null;

  /** The name of the guild that this preview belongs to */
  public name!: string;

  /**
   * Creates a new [GuildPreview] instance
   * @param data The data from Discord
   */
  constructor(client: WebSocketClient, data: APIGuildPreview) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: APIGuildPreview) {
    super.patch(data);

    this.approximatePresenceCount = data.approximate_presence_count;
    this.approximateMemberCount = data.approximate_member_count;
    this.discoverySplash = data.discovery_splash;
    this.features = data.features;
    this.emojis = data.emojis.map(emote => new GuildEmoji(this.client, emote));
    this.icon = data.icon;
    this.name = data.name;
  }

  get discoverySplashUrl() {
    if (this.discoverySplash === null) return null;

    return `${CDNUrl}/discovery-splashes/${this.id}/${this.discoverySplash}`;
  }

  get splashUrl() {
    return this.splash ? `${CDNUrl}/splashes/${this.id}/${this.splash}` : null;
  }

  toString() {
    return `[wumpcord.GuildPreview<G: ${this.name}>]`;
  }
}
