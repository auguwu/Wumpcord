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

import type { WebSocketClient } from '../Client';
import type { APIApplication, APITeam } from 'discord-api-types';
import { BaseEntity } from './BaseEntity';
import { User } from './User';
import { CDN } from '@wumpcord/rest';

/**
 * https://discord.com/developers/docs/resources/application#application-resource
 */
export class Application extends BaseEntity<APIApplication> { // terms_of_service_url?
  /**
   * URI of the Terms of Service of this [Application]
   */
  public termsOfServiceUri?: string;

  /**
   * If this [Application] requires a full OAuth2 code grant flow on join
   */
  public requiresCodeGrant!: boolean;

  /**
   * URI of the Privacy Policy of this [Application]
   */
  public privacyPolicyUri?: string;

  /**
   * If this [Application] is a game sold on Discord, this is the ID of the "Game SKU" that is created; if it exists
   */
  public primarySkuId?: string;

  /**
   * The description of the application
   */
  public description!: string | null;

  /**
   * Array of RPC origin URLs, if RPC is enabled in this application
   */
  public rpcOrigins?: string[];

  /**
   * The default rich presence invite cover image hash for this application
   */
  public coverImage?: string;

  /**
   * If false, this application can be only invited by the bot owner
   */
  public public!: boolean;

  /**
   * If this [Application] is a game sold on Discord, this is the guild that it is linked to
   */
  public guildID?: string;

  /**
   * If this [Application] is a game sold on Discord, this will be the summary field for the store page
   * of it's primary SKU.
   */
  public summary?: string;

  /**
   * The owner of this [Application], if the application belongs in a team,
   * it'll return `null` and not cached.
   */
  public owner!: User | null;

  /**
   * This [Application]'s public flags
   */
  public flags!: number;

  /**
   * The name of this [Application]
   */
  public name!: string;

  /**
   * The team associated with this [Application].
   */
  public team?: APITeam;

  /**
   * The icon hash with this [Application].
   */
  public icon!: string | null;

  /**
   * If this [Application] is a game sold on Discord, this field is the URL slug
   * that links to the store page
   */
  public slug?: string;
  #client: WebSocketClient;

  constructor(client: WebSocketClient, data: APIApplication) {
    super(data.id);

    this.#client = client;
    this.patch(data);
  }

  patch(data: Partial<APIApplication>) {
    if (data.terms_of_service_url !== undefined)
      this.termsOfServiceUri = data.terms_of_service_url;

    if (data.bot_require_code_grant !== undefined)
      this.requiresCodeGrant = Boolean(data.bot_require_code_grant);

    if (data.privacy_policy_url !== undefined)
      this.privacyPolicyUri = data.privacy_policy_url;

    if (data.primary_sku_id !== undefined)
      this.primarySkuId = data.primary_sku_id;

    if (data.description !== undefined)
      this.description = data.description;

    if (data.rpc_origins !== undefined)
      this.rpcOrigins = data.rpc_origins;

    if (data.cover_image !== undefined)
      this.coverImage = data.cover_image;

    if (data.bot_public !== undefined)
      this.public = Boolean(data.bot_public);

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.summary !== undefined)
      this.summary = data.summary;

    if (data.owner !== undefined)
      this.owner = /team\d+/g.test(data.owner.username) ? null : new User(this.#client, data.owner);

    if (data.flags !== undefined)
      this.flags = data.flags;

    if (data.team !== undefined)
      this.team = data.team !== null ? data.team : undefined;

    if (data.icon !== undefined)
      this.icon = data.icon;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.slug !== undefined)
      this.slug = data.slug;
  }

  /**
   * Returns the URI of the icon for this [Application]
   */
  get iconUrl() {
    return this.icon === null ? null : CDN.getApplicationIcon(this.id, this.icon);
  }

  /**
   * Returns the cover image URI of this [Application]
   */
  get coverUrl() {
    return this.coverImage ? null : CDN.getApplicationIcon(this.id, this.coverImage!);
  }

  /**
   * Returns a boolean value if this [Application] has the `GUILD_MEMBERS` intent
   * or the `GUILD_PRESENCES` intent.
   */
  get hasPrivilegedIntents() {
    return !!(this.flags & 1 << 12) || !!(this.flags & 1 << 15);
  }

  /**
   * Returns a boolean if this [Application] is pending verification
   */
  get isPendingVerification() {
    return !!(this.flags & 1 << 16);
  }
}
