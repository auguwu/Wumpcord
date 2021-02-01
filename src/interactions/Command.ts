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

import type * as interactions from './types';
import Option from './Option';
import Base from '../models/Base';

interface ApplicationCommand extends interactions.ApplicationCommand {
  is_guild?: boolean; // eslint-disable-line camelcase
}

export default class InteractionCommand extends Base<ApplicationCommand> {
  public applicationID!: string;
  public description!: string;
  public isGuild!: boolean;
  public options!: Option[];
  public name!: string;

  constructor(data: ApplicationCommand) {
    super(data.id);

    this.patch(data);
  }

  patch(data: ApplicationCommand) {
    if (data.application_id !== undefined)
      this.applicationID = data.application_id;

    if (data.description !== undefined)
      this.description = data.description;

    if (data.options !== undefined)
      this.options = data.options.map(option => new Option(option));

    if (data.is_guild !== undefined)
      this.isGuild = data.is_guild ?? false; // we pass this, not discord

    if (data.name !== undefined)
      this.name = data.name;
  }
}
