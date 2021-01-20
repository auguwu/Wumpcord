/**
 * Copyright (c) 2020-2021 August, Ice
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

import Argument, { ArgumentInfo } from './arguments/Argument';
import type CommandMessage from './CommandMessage';
import CommandClient from './CommandClient';
import type Command from './Command';

/** Represents a [Subcommand] definition */
export interface SubcommandDefinition {
  /** The description of the subcommand, it'll default to `No description was provided.` */
  description?: string;

  /** Any additional aliases to run this [Subcommand] */
  aliases?: string[];

  /** List of arguments except the subcommand's name to provide */
  args?: ArgumentInfo[];

  /** The name of the subcommand, this must match the function name or it won't run */
  name: string;
}

export default class Subcommand {
  /** The description of the subcommand, it'll default to `No description was provided.` */
  public description: string;

  /** List of additional aliases to run this [Subcommand] */
  public aliases: string[];

  /** The parent command to run this [Subcommand] */
  public parent: Command;

  /** List of arguments to have, if any */
  public args: Argument[];

  /** The name of the subcommand, this must match the function name or it won't run */
  public name: string;

  /** The bot instance */
  public bot!: CommandClient;

  /**
   * Creates a new [Subcommand] instance
   * @param parent The parent command
   * @param definition The subcommand's definition metadata
   */
  constructor(parent: Command, definition: SubcommandDefinition) {
    this.description = definition.description ?? 'No description was provided.';
    this.aliases = definition.aliases ?? [];
    this.parent = parent;
    this.args = definition.args?.map(arg => new Argument(arg)) ?? [];
    this.name = definition.name;
  }

  init(bot: CommandClient) {
    this.bot = bot;
    return this;
  }

  /**
   * Runs the subcommand from the parent command
   * @param msg The command message created
   * @param args The arguments supplied by the command's executor
   * @throws {TypeError}: If the executor function isn't present in the parent command
   * @throws {SyntaxError}: If the executor function wasn't a function that is callable
   */
  run(msg: CommandMessage, args: any) {
    const executor = this.parent[this.name];

    if (executor === undefined) throw new TypeError(`Subcommand "${this.name}" doesn't exist in the parent command (command=${this.parent.name})`);
    if (typeof executor !== 'function') throw new SyntaxError(`Subcommand executor for "${this.name}" was not a callable function, received ${typeof executor}`);

    return executor.call(this.parent, msg, args);
  }
}
