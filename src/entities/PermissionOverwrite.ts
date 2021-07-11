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

import { APIOverwrite, OverwriteType } from 'discord-api-types';
import { Permission } from '..';
import { BaseEntity } from './BaseEntity';

/**
 * https://discord.com/developers/docs/topics/permissions#permission-overwrites
 */
export class PermissionOverwrite extends BaseEntity<APIOverwrite> {
  /**
   * List of permissions available for this [[PermissionOverwrite]].
   */
  public permissions!: Permission;

  /**
   * The overwrite type
   */
  public type!: 'role' | 'member';

  constructor(data: APIOverwrite) {
    super(data.id);

    this.patch(data);
  }

  patch(data: Partial<APIOverwrite>) {
    if (data.allow !== undefined)
      this.permissions = new Permission(data.allow as `${bigint}`, data.deny);

    if (data.type !== undefined)
      this.type = data.type === OverwriteType.Role ? 'role' : 'member';
  }
}
