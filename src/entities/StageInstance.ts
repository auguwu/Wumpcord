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

/* eslint-disable camelcase */

import type { ModifyStageInstance, WebSocketClient } from '../Client';
import { StageInstancePrivacyLevel } from '../Constants';
import type { StageChannel } from './StageChannel';
import type { Snowflake } from 'discord-api-types';
import { BaseEntity } from './BaseEntity';

/**
 * https://discord.com/developers/docs/resources/stage-instance#stage-instance-object-stage-instance-structure
 */
export interface APIStageInstance {
  /**
   * Whether or not Stage discovery is disabled
   */
  discoverable_disabled: boolean;

  /**
   * Privacy level of the stage instance
   */
  privacy_level: number;

  /**
   * The id of the associated Stage channel
   */
  channel_id: string;

  /**
   * The guild ID of the associated Stage channel
   */
  guild_id: string;

  /**
   * The topic of the Stage instance (1-120 chars)
   */
  topic: string;

  /**
   * The snowflake of this State instance
   */
  id: Snowflake;
}

/**
 * https://discord.com/developers/docs/resources/stage-instance#stage-instance-resource
 */
export class StageInstance extends BaseEntity<APIStageInstance> {
  /**
   * Whether or not Stage discovery is disabled
   */
  public canBeDiscovered!: boolean;

  /**
   * Privacy level of the stage instance
   */
  public privacyLevel!: StageInstancePrivacyLevel;

  /**
   * The id of the associated Stage channel
   */
  public channelID!: string;

  /**
   * The client attached to this [StageInstance]
   */
  private client: WebSocketClient;

  /**
   * The guild ID of the associated Stage channel
   */
  public guildID!: string;

  /**
   * The topic of the Stage instance (1-120 chars)
   */
  public topic!: string;

  constructor(client: WebSocketClient, data: APIStageInstance) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: Partial<APIStageInstance>) {
    if (data.discoverable_disabled !== undefined)
      this.canBeDiscovered = data.discoverable_disabled;

    if (data.privacy_level !== undefined)
      this.privacyLevel = data.privacy_level;

    if (data.channel_id !== undefined)
      this.channelID = data.channel_id;

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.topic !== undefined)
      this.topic = data.topic;
  }

  /**
   * Returns the stage channel, if cached
   */
  get channel() {
    return this.client.channels.get<StageChannel>(this.channelID);
  }

  /**
   * Returns the guild from this stage instance, if cached
   */
  get guild() {
    return null;
  }

  /**
   * Modifies fields of an existing stage instance
   * @param privacy_level The privacy level
   * @param topic The topic of the stage instance
   */
  modify({ privacy_level, topic }: ModifyStageInstance) {
    return this.client.editStageInstance.call(this.client, this.id, { privacy_level, topic });
  }

  /**
   * Deletes this stage instance
   */
  delete() {
    return this.client.deleteStageInstance.call(this.client, this.id);
  }
}
