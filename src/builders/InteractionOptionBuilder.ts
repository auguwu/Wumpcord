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

import { APIApplicationCommandArgumentOptions, APIApplicationCommandOption, APIApplicationCommandOptionChoice, APIApplicationCommandSubCommandOptions } from 'discord-api-types';

// discord-api-types please make this not a const enum :sob:
enum ApplicationCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9
}

/**
 * Represents a builder class to create a option for a slash command,
 * this is represented as an argument which can have nested parameters.
 *
 * If you wish to create subcommands / subcommand groups, please refer to
 * [[InteractionSubcommandBuilder]] or [[InteractionSubcommandGroupBuilder]].
 */
export class InteractionOptionBuilder {
  private description!: string;
  private required!: boolean;
  private options: APIApplicationCommandOption[] = [];
  private choices: APIApplicationCommandOptionChoice[] = [];
  private name!: string;
  private type!: number;

  /**
   * Sets the description of this option
   * @param description The description
   * @returns This [[InteractionOptionBuilder]] to chain methods
   */
  setDescription(description: string) {
    this.description = description;
    return this;
  }

  /**
   * Sets the type of this [[InteractionOptionBuilder]], this can reflect on [[InteractionOptionBuilder.build]] function.
   * @param type The type to use
   * @returns This [[InteractionOptionBuilder]] to chain methods
   */
  setType(type: keyof typeof ApplicationCommandOptionType) {
    this.type = ApplicationCommandOptionType[type];
    return this;
  }

  /**
   * Sets the name for this option
   * @param name The name of the option
   * @returns This [[InteractionOptionBuilder]] to chain methods
   */
  setName(name: string) {
    this.name = name;
    return this;
  }

  /**
   * Sets this [[InteractionOptionBuilder]] to be a required option.
   * @returns This [[InteractionOptionBuilder]] to chain methods
   */
  isRequired() {
    this.required ??= true;
    return this;
  }

  /**
   * Adds a choice to use when this [[InteractionOptionBuilder]] is a
   * `STRING` or `INTEGER` option.
   *
   * @param name The name of the choice
   * @param value The value of the choice
   * @returns This [[InteractionOptionBuilder]] to chain methods
   */
  addChoice(name: string, value: string | number) {
    if (this.type === undefined)
      throw new TypeError('type must be defined, use .setType before this function call.');

    if (![ApplicationCommandOptionType.INTEGER, ApplicationCommandOptionType.STRING].includes(this.type))
      throw new TypeError('This option must be a INTEGER or STRING type.');

    this.choices.push({ name, value });
    return this;
  }

  /**
   * Adds multiple choices to use when this [[InteractionOptionBuilder]]
   * is a `STRING` or `INTEGER` option
   *
   * @param choices Array of choices to add
   * @returns This [[InteractionOptionBuilder]] to chain methods
   */
  addChoices(choices: APIApplicationCommandOptionChoice[]) {
    this.choices = this.choices.concat(choices);
    return this;
  }

  /**
   * Adds a subcommand option if this [[InteractionOptionBuilder]] is a
   * `SUBCOMMAND` or a `SUBCOMMAND_GROUP`.
   *
   * @param option The option to create
   * @returns This [[InteractionOptionBuilder]] to chain methods.
   */
  addOption(option: APIApplicationCommandSubCommandOptions | InteractionOptionBuilder) {
    if (this.type === undefined)
      throw new TypeError('Missing `type` in this InteractionOptionBuilder; add it using the \`setType()\` function.');

    if (![ApplicationCommandOptionType.SUB_COMMAND, ApplicationCommandOptionType.SUB_COMMAND_GROUP].includes(this.type))
      throw new TypeError('Only the types `SUBCOMMAND` and `SUB_COMMAND_GROUP` are allowed.');

    if (option instanceof InteractionOptionBuilder)
      option = option.build() as any;

    this.options.push(option as any);
    return this;
  }

  /**
   * Adds multiple subcommand options for this [[InteractionOptionBuilder]]
   * if this [[InteractionOptionBuilder]] is a `SUB_COMMAND` or a `SUB_COMMAND_GROUP` type.
   *
   * @param options Any additional options to create
   * @returns This [[InteractionOptionBuilder]] to chain methods.
   */
  // eslint-disable-next-line @typescript-eslint/array-type
  addOptions(options: Array<APIApplicationCommandSubCommandOptions | InteractionOptionBuilder>) {
    if (this.type === undefined)
      throw new TypeError('Missing `type` in this InteractionOptionBuilder; add it using the \`setType()\` function.');

    if (![ApplicationCommandOptionType.SUB_COMMAND, ApplicationCommandOptionType.SUB_COMMAND_GROUP].includes(this.type))
      throw new TypeError('Only the types `SUBCOMMAND` and `SUB_COMMAND_GROUP` are allowed.');

    const all = options.map(option => option instanceof InteractionOptionBuilder ? option.build() as any : option);
    this.options = this.options.concat(all as any[]);

    return this;
  }

  /**
   * Returns the raw options you created using this [[InteractionOptionBuilder]].
   */
  build() {
    const original: APIApplicationCommandOption = {
      description: this.description,
      type: this.type,
      name: this.name
    };

    if ((this.type === ApplicationCommandOptionType.STRING || this.type === ApplicationCommandOptionType.BOOLEAN) && this.choices.length > 0)
      (original as APIApplicationCommandArgumentOptions).choices = this.choices;

    if ((this.type === ApplicationCommandOptionType.SUB_COMMAND || this.type === ApplicationCommandOptionType.SUB_COMMAND_GROUP) && this.options !== undefined)
      (original as APIApplicationCommandSubCommandOptions).options = this.options;

    if (this.required !== undefined && this.required === true)
      original.required = true;

    return original;
  }
}
