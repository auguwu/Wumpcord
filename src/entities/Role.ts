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

import type { APIRole as _APIRole, APIRoleTags as _APIRoleTags } from 'discord-api-types';
import { BaseEntity } from './BaseEntity';
import { Permission } from '../util/Permissions';

/**
 * The role tags for this [[Role]].
 */
export type APIRoleTags = Pick<_APIRoleTags, 'bot_id' | 'integration_id'> & { premium_subscriber: boolean };

/**
 * Type alias of an array with 3 elements to represent a RGB color value
 */
export type RGBValue = [
  red?: number,
  green?: number,
  blue?: number
];

// Represents a Role object from Discord
// Docs: https://discord.com/developers/docs/topics/permissions#role-object
interface APIRole extends _APIRole {
  // The guild ID supplied if any
  guild_id?: string;
}

/**
 * https://discord.com/developers/docs/topics/permissions#role-object
 */
export class Role extends BaseEntity<APIRole> {
  /**
   * If this [[Role]] belongs to a integration
   */
  public integrationID?: string;

  /**
   * List of permissions available for this [[Role]]
   */
  public permissions!: Permission;

  /**
   * If this [[Role]] is mentionable or not
   */
  public mentionable!: boolean;

  /**
   * The sorting position this [[Role]] is in
   */
  public position!: number;

  /**
   * If this [[Role]] is managed by a integration or not
   */
  public managed!: boolean;

  /**
   * The guild ID of this [[Role]] if any is supplied.
   */
  public guildID?: string;

  /**
   * If this [[Role]] is hoisted or not
   */
  public hoist!: boolean;

  /**
   * The color by integer of this [[Role]]
   */
  public color!: number;

  /**
   * The name of this [[Role]]
   */
  public name!: string;

  /**
   * The tags available of this [[Role]]
   */
  public tags!: APIRoleTags;

  constructor(data: APIRole) {
    super(data.id);

    this.guildID = data.guild_id;
    this.patch(data);
  }

  patch(data: Partial<APIRole>) {
    if (data.permissions !== undefined)
      this.permissions = new Permission(data.permissions);

    if (data.mentionable !== undefined)
      this.mentionable = data.mentionable;

    if (data.position !== undefined)
      this.position = data.position;

    if (data.managed !== undefined)
      this.managed = data.managed;

    if (data.hoist !== undefined)
      this.hoist = data.hoist;

    if (data.color !== undefined)
      this.color = data.color;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.tags !== undefined) {
      this.tags = data.tags as any;
      if (this.tags.premium_subscriber === null)
        this.tags.premium_subscriber = true;
    }
  }

  /**
   * Returns the hexadecimal color of this [[Role]].
   */
  get hexColour() {
    return this.color === 0 ? '000000' : this.color.toString(16);
  }

  /**
   * Returns the color RGB value of this [[Role]].
   */
  get rgb(): RGBValue {
    if (this.color === 0)
      return [0, 0, 0];

    const items = [0, 0, 0] as unknown as RGBValue[];
    const result = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(this.hexColour);
    if (result !== null) {
      items[0] = <any> parseInt(result[1], 16);
      items[1] = <any> parseInt(result[2], 16);
      items[2] = <any> parseInt(result[3], 16);
    }

    return <any> items;
  }

  toString() {
    return `[Role ${this.name} (${this.id})]`;
  }
}
