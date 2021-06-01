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

import { GatewayActivityAssets, GatewayActivityEmoji, GatewayActivityParty, GatewayActivitySecrets, PresenceUpdateStatus, GatewayPresenceUpdate } from 'discord-api-types';
import { Util } from '..';
import { WebSocketClient } from '../Client';
import { ActivityStatus } from '../Constants';
import { OnlineStatus, PartialEntity } from '../types';
import { BaseEntity } from './BaseEntity';
import { User } from './User';

/**
 * https://discord.com/developers/docs/topics/gateway#activity-object-activity-structure
 */
export interface PresenceActivity {
  // props that aren't documented
  sessionID?: string;
  platform?: 'samsung' | 'xbox' | 'desktop';
  syncID?: string;
  id: string;

  /**
   * Application ID of the activity
   */
  applicationID?: string;

  /**
   * Unix timestamps of when the activity starts and/or ends in a form of 2 elements in an array:
   *
   * `[start, end]`.
   */
  timestamps?: [start?: number, end?: number];

  /**
   * Ehether or not the activity is an instanced game session
   */
  instance?: boolean;

  /**
   * JavaScript date of when the activity was added to the user's session
   */
  createdAt: Date;

  /**
   * Details of what the user is doing
   */
  details?: string | null;

  /**
   * List of buttons to display on a rich presence. It can be an
   * array of strings (which being the labels) or a object of the
   * label and the URL it goes to. Bots cannot access the user's buttons,
   * so it'll be an array of strings.
   */
  buttons?: (string | PresenceActivityButtons)[];

  /**
   * secrets for Rich Presence joining and spectating
   */
  secrets?: GatewayActivitySecrets;

  /**
   * Images for the presence and their hover texts.
   */
  assets?: GatewayActivityAssets;

  /**
   * Information of the current party of the player.
   */
  party?: GatewayActivityParty;

  /**
   * The user's current party status
   */
  state?: string | null;

  /**
   * Emoji object for custom statuses (type `4`)
   */
  emoji?: GatewayActivityEmoji;

  /**
   * Activity flags `OR`d together, describes what the payload includes.
   */
  flags?: number;

  /**
   * The activity type
   */
  type: ActivityStatus;

  /**
   * The activity's name
   */
  name: string;

  /**
   * The stream URl, validated when type is `1` (Streaming)
   */
  url?: string | null;

  /**
   * If this activity has a rich presence or not.
   */
  rpc: boolean;
}

export interface PresenceActivityButtons {
  /**
   * The text shown on the button (1-32 characters)
   */
  label?: string;

  /**
   * The url opened when clicking the button (1-512 characters)
   */
  url?: string;
}

export type ClientStatus = Partial<Record<'desktop' | 'mobile' | 'web', OnlineStatus>>;

/**
 * https://discord.com/developers/docs/topics/gateway#presence
 */
export class Presence extends BaseEntity<GatewayPresenceUpdate> {
  /**
   * Platform-dependent status of this presence.
   */
  public clientStatus!: ClientStatus;

  /**
   * List of current activities
   */
  public activities!: PresenceActivity[];

  /**
   * The WebSocketClient attached to this presence
   */
  public client: WebSocketClient;

  /**
   * ID of the guild that this presence belongs to
   */
  public guildID!: string;

  /**
   * The user status
   */
  public status!: OnlineStatus;

  /**
   * The user itself
   */
  public user!: PartialEntity<User>;

  constructor(client: WebSocketClient, data: GatewayPresenceUpdate) {
    super();

    this.client = client;
    this.patch(data);
  }

  patch(data: Partial<GatewayPresenceUpdate>) {
    if (data.client_status !== undefined) {
      this.clientStatus = {
        desktop: Util.get(data.client_status, 'desktop', PresenceUpdateStatus.Offline),
        mobile: Util.get(data.client_status, 'mobile', PresenceUpdateStatus.Offline),
        web: Util.get(data.client_status, 'web', PresenceUpdateStatus.Offline)
      };
    }

    if (data.activities !== undefined)
      this.activities = data.activities.map<PresenceActivity>(activity => ({
        // undocumented
        sessionID: activity.session_id,
        platform: activity.platform,
        syncID: activity.sync_id,
        id: activity.id,

        // documented
        applicationID: activity.application_id,
        timestamps: activity.timestamps !== undefined ? [activity.timestamps.start!, activity.timestamps.end!] : [] as PresenceActivity['timestamps'],
        instance: activity.instance,
        createdAt: new Date(activity.created_at),
        details: activity.details,
        buttons: activity.buttons,
        secrets: activity.secrets,
        assets: activity.assets,
        party: activity.party,
        state: activity.state,
        emoji: activity.emoji,
        flags: activity.flags,
        type: activity.type as unknown as ActivityStatus,
        name: activity.name,
        url: activity.url,
        rpc: activity.state !== undefined && activity.details !== undefined
      }));

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.status !== undefined)
      this.status = data.status;

    if (data.user !== undefined)
      this.user = data.user.hasOwnProperty('username') ? this.client.users.put(new User(this.client, data.user as any)) : { id: data.user.id };
  }
}
