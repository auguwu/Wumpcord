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

import type {
  GatewayActivity,
  GatewayActivityTimestamps,
  GatewayActivityParty,
  GatewayActivityEmoji,
  ActivityType
} from 'discord-api-types';

export default class Activity {
  /** The timestamps available for this [Activity] */
  public timestamps!: GatewayActivityTimestamps;

  /** Details on when the activity started displaying */
  public createdAt!: Date;

  /** The details of the [Activity], indicating this is a Rich Presence */
  public details!: string | null;

  /** Assets available for this [Activity], if any */
  public assets!: GatewayActivity['assets'];

  /** The partial emoji instance */
  public emoji!: GatewayActivityEmoji;

  /** The state of the [Activity], indicating this is a Rich Presence */
  public state!: string | null;

  /** The party details for this [Activity], if any */
  public party!: GatewayActivityParty;

  /** The type of the activity */
  public type: ActivityType;

  /** The name of the activity */
  public name: string;

  /** If this activity is a Rich Presence activity or not */
  public rpc!: boolean;

  /**
   * Creates a new [Activity] instance
   * @param data The activity data
   */
  constructor(data: GatewayActivity) {
    this.createdAt = new Date(data.created_at);
    this.type = data.type;
    this.name = data.name;

    this.patch(data);
  }

  patch(data: GatewayActivity) {
    this.rpc = data.hasOwnProperty('details') && data.hasOwnProperty('state');

    if (data.timestamps !== undefined)
      this.timestamps = data.timestamps;

    if (data.details !== undefined)
      this.details = data.details;

    if (data.state !== undefined)
      this.state = data.state;

    if (data.emoji !== undefined)
      this.emoji = data.emoji;

    if (data.assets !== undefined)
      this.assets = data.assets;

    if (data.party !== undefined)
      this.party = data.party;
  }

  toString() {
    return `[wumpcord.PresenceActivity<N: ${this.name}, T: ${this.type}>]`;
  }
}
