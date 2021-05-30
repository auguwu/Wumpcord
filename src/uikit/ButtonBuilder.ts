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

import { firstUpper, omitUndefinedOrNull } from '@augu/utils';
import type { APIComponentButton } from './ComponentTreeBuilder';
import { randomBytes } from 'crypto';

/**
 * List of button styles for a [[ButtonBuilder]] instance.
 */
export enum ButtonStyles {
  /**
   * Represents a "primary" button, the colour is gonna be Blurple.
   */
  Primary = 1,

  /**
   * Represents a secondary button, colour is gonna be Grey.
   */
  Secondary,

  /**
   * Represents a "success" button, colour is gonna be Green.
   */
  Success,

  /**
   * Represents a "danger" button, colour is gonna be Red.
   */
  Danger,

  /**
   * Represents a "link" button, which will navigate to a URL.
   */
  Link
}

/**
 * Type alias for a lowercased version of the keys in [[ButtonStyles]].
 */
export type ButtonStyle = Lowercase<keyof typeof ButtonStyles>;

/**
 * Represents a builder class to easily construct buttons in a [[ComponentTreeBuilder]].
 * @example
 * ```js
 * const { Client, ComponentTreeBuilder, ButtonBuilder } = require('wumpcord');
 * const client = new Client({ token: '', intents: ['GUILD_MESSAGES', 'GUILDS'] });
 *
 * client.on('message', msg => {
 *    if (msg.content === '!test')
 *       return msg.channel.send({
 *          content: 'Hello, world!',
 *          components: new ComponentTreeBuilder()
 *               .addButton(new ButtonBuilder().setLabel('hi world').setEmoji('id', 'name').setStyle('primary').setCustomID('abutton').build())
 *               .build()
 *       });
 * });
 *
 * client.on('buttonClicked', (msg, button) => {
 *    console.log(`Button ${button.customID} has been clicked.`);
 *    if (msg.author.id !== 'some id' || button.customID !== 'abutton') return;
 *
 *    return msg.reply('i dunno im just a button.');
 * });
 *
 * client.connect();
 * ```
 *
 * @docs {@link https://discord.com/developers/docs/interactions/message-components#buttons}
 */
export class ButtonBuilder {
  private disabled?: boolean;
  private customID: string = `wumpcord-button-${randomBytes(8).toString('hex')}`;
  private emoji?: [id: string, name: string | null];
  private label?: string;
  private style?: number;
  private url?: string;

  /**
   * Sets a label of this button.
   * @param label The label for this button
   * @returns This [[ButtonBuilder]] for chaining methods.
   */
  setLabel(label: string) {
    this.label = label;
    return this;
  }

  /**
   * Sets the style of this button, this is required.
   * @param style The style to use
   * @returns This [[ButtonBuilder]] for chaining methods.
   */
  setStyle(style: ButtonStyle) {
    this.style = ButtonStyles[firstUpper(style)];
    return this;
  }

  /**
   * Sets a custom ID for this button, a developer-defined unique ID.
   * If none is specified, it'll generate a random one.
   *
   * @param id The unique ID for this button, if none is specified,
   * it'll auto-generate.
   * @returns This [[ButtonBuilder]] for chaining methods.
   */
  setCustomID(id?: string) {
    const uid = id !== undefined ? id : `wumpcord-button-${randomBytes(8).toString('hex')}`;
    this.customID = uid;

    return this;
  }

  /**
   * Sets a emoji on this button.
   * @param emoji The emoji instance from the client or guild.
   * @returns This [[ButtonBuilder]] for chaining methods.
   */
  setEmoji(emoji: any): this;

  /**
   * Sets a emoji on this button.
   * @param emojiID The emoji's ID
   * @param name The emoji name, it can be `null` if it's a unicode emoji.
   * @returns This [[ButtonBuilder]] for chaining methods.
   */
  setEmoji(emojiID: string, name?: string | null): this;
  setEmoji(emojiID: string, name: string | null = null) {
    this.emoji = typeof emojiID === 'string' ? [emojiID, name] : [(emojiID as any).id, (emojiID as any).name];
    return this;
  }

  /**
   * Make this button disabled.
   * @returns This [[ButtonBuilder]] for chaining methods.
   */
  setDisabled() {
    this.disabled = this.disabled === undefined ? true : !this.disabled;
    return this;
  }

  /**
   * Sets a clickable URL for this button.
   * @returns This [[ButtonBuilder]] for chaining methods.
   */
  setUrl(url: string) {
    this.url = url;
    return this;
  }

  /**
   * Builds this [[ButtonBuilder]] that is passable to Discord.
   */
  build() {
    return omitUndefinedOrNull<APIComponentButton>({
      type: 2,
      style: this.style!,
      label: this.label,
      emoji: this.emoji !== undefined ? { id: this.emoji[0], name: this.emoji[1] ?? null } : undefined,
      custom_id: this.customID,
      url: this.url,
      disabled: this.disabled
    });
  }
}
