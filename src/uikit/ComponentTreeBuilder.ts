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

import { omitUndefinedOrNull } from '@augu/utils';
import { ButtonBuilder } from './ButtonBuilder';

/**
 * https://discord.com/developers/docs/interactions/message-components#buttons
 */
// TODO: use discord-api-types version once that is shipped
export interface APIComponentButton {
  type: 2;
  style: number;
  label?: string;
  emoji?: { id: string; name: string | null; }
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

/**
 * https://discord.com/developers/docs/interactions/message-components#actionrow
 */
// TODO: use discord-api-types version once that is shipped
export interface APIComponentActionRow {
  type: 1;
  components: APIComponentButton[];
}

/**
 * Represents a builder to create a component tree for sending messages
 * through interactions or the gateway. This is just an action row that
 * is passable through the [[`TextChannel#send`]], [[`InteractionMessage#reply`]], etc methods.
 *
 * @docs {@link https://discord.com/developers/docs/interactions/message-components#actionrow}
 */
export class ComponentTreeBuilder {
  private buttons?: APIComponentButton[];

  /**
   * Adds a button to this action row.
   * @param button The button builder or the raw JSON data.
   * @returns This [[ComponentTreeBuilder]] instance to chain methods.
   */
  addButton(button: APIComponentButton | ButtonBuilder) {
    if (button instanceof ButtonBuilder)
      button = button.build();

    (this.buttons ??= []).push(button);
    return this;
  }

  /**
   * Returns the raw JSON data that is passable to Discord.
   */
  build() {
    return omitUndefinedOrNull<APIComponentActionRow>({
      type: 1,
      components: this.buttons ?? []
    });
  }
}
