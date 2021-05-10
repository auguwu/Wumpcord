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

import { APIApplicationCommandOption } from 'discord-api-types';
import { InteractionOptionBuilder } from './InteractionOptionBuilder';

const COMMAND_NAME_REGEX = /^[\w-]{1,32}$/;

/**
 * Represents a builder class for easy slash command creation
 */
export class InteractionCommandBuilder {
  /**
   * Whenther the command is enabled by default when the bot is added to a guild
   */
  private defaultPermission: boolean = true;

  /**
   * A 1-100 character description of this slash command
   */
  private description?: string;

  /**
   * A list of options for the parameters of this slash command
   */
  private options: APIApplicationCommandOption[] = [];

  /**
   * The name of the slash command
   */
  private name?: string;

  /**
   * Sets the default permission for this [[InteractionCommandBuilder]]
   * @returns This builder to chain methods
   */
  setDefaultPermission() {
    this.defaultPermission = !this.defaultPermission;
    return this;
  }

  /**
   * Sets a 1-100 character description of this slash command
   * @param description The description of this slash command
   * @returns This builder to chain methods
   */
  setDescription(description: string) {
    if (description.length < 1 || description.length > 100)
      throw new TypeError(`Slash command descriptions must be lower than 100 or greater than 1. Provided "${description}" which is ${description.length - 100} characters over the limit.`);

    this.description = description;
    return this;
  }

  /**
   * Adds a option to this [[InteractionCommandBuilder]], only 25
   * parameters are allowed in a single slash command.
   *
   * @param option The option object to use
   * @returns This builder to chain methods
   */
  addOption(option: APIApplicationCommandOption | InteractionOptionBuilder) {
    if (this.options.length > 25)
      throw new TypeError(`Slash command options must have 25 parameters. You went over ${this.options.length - 25} over the limit.`);

    if (option instanceof InteractionOptionBuilder)
      option = option.build();

    this.options.push(option);
    return this;
  }

  /**
   * Bulk adds options to this [[InteractionCommandBuilder]]; only 25
   * parameters are allowed in a single slash command.
   *
   * @param options The options array to use
   * @returns This builder to chain methods
   */
  addOptions(options: APIApplicationCommandOption[]) {
    if (this.options.length > 25)
      throw new TypeError(`Slash command options must have 25 parameters. You went over ${this.options.length - 25} over the limit.`);

    this.options = this.options.concat(options);
    return this;
  }

  /**
   * Sets the name of this slash command
   * @param name The name of the slash command
   * @returns This builder to chain methods
   */
  setName(name: string) {
    if (!COMMAND_NAME_REGEX.test(name))
      throw new TypeError(`Command name failed expression "${COMMAND_NAME_REGEX}"`);

    this.name = name;
    return this;
  }

  /**
   * Returns a object of this [[InteractionCommandBuilder]], which
   * you can use [[WebSocketClient.createGuildSlashCommand]] or [[WebSocketClient.createGlobalSlashCommand]]
   * to register this slash command.
   */
  build() {
    return {
      default_permission: this.defaultPermission,
      description: this.description,
      options: this.options,
      name: this.name
    };
  }
}
