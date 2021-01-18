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

import type { CommandMessage } from '.';
import { Permissions } from '../Constants';
import CommandClient from './CommandClient';

type KeyedPermissions = keyof typeof Permissions;

/**
 * Represents the information of a [Command]
 */
export interface CommandInfo {
  /**
   * List of the command executor's permissions to follow to run this command, essentially locking it if they don't have the permission.
   *
   * This can be in the form of a number, [Permissions], the permission's name, or an array
   * if needed.
   *
   * Examples:
   * - `512`: **Send Messages** (`userPermissions: 512`)
   * - Permissions.sendMessages: (`userPermissions: Permissions.sendMessages`)
   * - `sendMessages`: (`userPermissions: 'sendMessages'`)
   */
  userPermissions?: number | Permissions | Permissions[] | KeyedPermissions | KeyedPermissions[];

  /**
   * List of the bot's permissions to follow to run this command, essentially locking it if they don't have the permission.
   *
   * This can be in the form of a number, [Permissions], the permission's name, or an array
   * if needed.
   *
   * Examples:
   * - `512`: **Send Messages** (`botPermissions: 512`)
   * - Permissions.sendMessages: (`botPermissions: Permissions.sendMessages`)
   * - `sendMessages`: (`botPermissions: 'sendMessages'`)
   */
  botPermissions?: number | Permissions | Permissions[] | KeyedPermissions | KeyedPermissions[];

  /**
   * The list of subcommands for this [Command], this can be used with Decorators,
   * so you don't need to populate this field if you're gonna use Decorators.
   *
   * Note that the name of the subcommand must be the same as the function
   * name you're gonna call it or it'll not work.
   */
  subcommands?: SubcommandDefinition[];

  /**
   * The command's description, this is defaulted to `No description was provided.`
   */
  description?: string;

  /**
   * A checker if the command should be ran in a guild only or not
   */
  guildOnly?: boolean;

  /**
   * A checker if the command should be ran by the owners only
   */
  ownerOnly?: boolean;

  /**
   * Cooldown amount in seconds to pause the execution until exhausted.
   */
  cooldown?: number;

  /**
   * Any additional aliases to run this command
   */
  aliases?: string[];

  /**
   * List of arguments to provide for the user if needed.
   */
  args?: ArgumentInfo[];

  /**
   * The command's name
   */
  name: string;
}

/** Function caller for any subcommand */
type SubcommandExecutor = <T extends object = object>(
  msg: CommandMessage,
  args: T
) => Promise<void>;

/** Interface for TypeScript users to use this for type-checking if they are using decorators */
export interface CommandExecutor {
  /**
   * Runs the parent command, any subcommand will be ran in defined using
   * the `@Subcommand` decorator or listed in [CommandInfo].
   *
   * @param msg The command message that was created in the command handler
   * @param args Any additional arguments, if present by the user
   * @returns A [Promise] of nothing.
   */
  run(
    msg: CommandMessage,
    args: any
  ): any;
}

/**
 * Represents a [Command] executor
 * @abstract
 */
export default abstract class Command {
  public ['constructor']!: typeof Command;

  /**
   * List of the command executor's permissions to follow to run this command, essentially locking it if they don't have the permission.
   *
   * This can be in the form of a number, [Permissions], the permission's name, or an array
   * if needed.
   *
   * Examples:
   * - `512`: **Send Messages** (`userPermissions: 512`)
   * - Permissions.sendMessages: (`userPermissions: Permissions.sendMessages`)
   * - `sendMessages`: (`userPermissions: 'sendMessages'`)
   */
  public userPermissions: number;

  /**
   * List of the bot's permissions to follow to run this command, essentially locking it if they don't have the permission.
   *
   * This can be in the form of a number, [Permissions], the permission's name, or an array
   * if needed.
   *
   * Examples:
   * - `512`: **Send Messages** (`botPermissions: 512`)
   * - Permissions.sendMessages: (`botPermissions: Permissions.sendMessages`)
   * - `sendMessages`: (`botPermissions: 'sendMessages'`)
   */
  public botPermissions: number;

  /**
   * The list of subcommands for this [Command], this can be used with Decorators,
   * so you don't need to populate this field if you're gonna use Decorators.
   *
   * Note that the name of the subcommand must be the same as the function
   * name you're gonna call it or it'll not work.
   */
  public subcommands: SubcommandDefinition[];

  /**
   * The command's description, this is defaulted to `No description was provided.`
   */
  public description: string;

  /**
   * A checker if the command should be ran in a guild only or not
   */
  public guildOnly: boolean;

  /**
   * A checker if the command should be ran by the owners only
   */
  public ownerOnly: boolean;

  /**
   * Cooldown amount in seconds to pause the execution until exhausted.
   */
  public cooldown: number;

  /**
   * Any additional aliases to run this command
   */
  public aliases: string[];

  /**
   * List of arguments to provide for the user if needed.
   */
  public args?: Argument[];

  /**
   * The command's name
   */
  public name: string;

  /**
   * The bot's command client
   */
  public bot!: CommandClient;

  /**
   * Constructs a new [Command] instance
   * @param info The command's metadata
   */
  constructor(info: CommandInfo) {
    this.userPermissions = this.constructor._resolvePermissionField(info.userPermissions);
    this.botPermissions  = this.constructor._resolvePermissionField(info.botPermissions);
    this.subcommands     = info.subcommands ?? [];
    this.description     = info.description ?? 'No description was provided.';
    this.guildOnly       = info.guildOnly ?? false;
    this.ownerOnly       = info.ownerOnly ?? false;
    this.cooldown        = info.cooldown ?? 3; // todo: add default command options
    this.args            = info.args ?? [];
    this.name            = info.name;
  }

  /**
   * Returns the command's usage prompt
   */
  get usage() {
    return '';
  }

  /**
   * Populates `bot` to the command
   */
  init(bot: CommandClient) {
    this.bot = bot;
    return this;
  }

  /**
   * Resolves the permission's to return a number
   * @param field The bitfield, array of strings, array of [Constants.Permissions], a string, or [Constants.Permissions]
   * @throws TypeError - If the permission doesn't exist or not a valid type
   * @returns The bitfield number for permission checking in the command handler
   */
  static _resolvePermissionField(field?: number | Permissions | Permissions[] | KeyedPermissions | KeyedPermissions[]) {
    // If it's not defined, we'll just set it as Read Messages and Send Messages
    if (typeof field === 'undefined') return (<number> Permissions.sendMessages | Permissions.readMessages);

    // If it's the bitfield itself, just return it
    if (typeof field === 'number') return field;

    // If it's a permission string, return it from Permissions enum
    if (typeof field === 'string') {
      if (!Permissions[field]) throw new TypeError(`Permission '${field}' does not exist.`);
      return Permissions[field];
    }

    // Check if it's an Array
    if (field instanceof Array) {
      // Convert it to an array of numbers
      const bitfields = (field as (Permissions | number)[]).map(bit => {
        if (typeof bit === 'number') return bit;
        if (!Permissions[bit]) return;

        return Permissions[bit];
      }) as number[];

      // Now format them to be into one bit
      return bitfields.reduce((a, b) => a & b, 0);
    }

    throw new TypeError('Permission field was not the following: number, Permission, KeyedPermission, or a Array of one of those 3.');
  }

  /**
   * Runs the parent command, any subcommand will be ran in defined using
   * the `@Subcommand` decorator or listed in [CommandInfo].
   *
   * @param msg The command message that was created in the command handler
   * @param args Any additional arguments, if present by the user
   * @returns A [Promise] of nothing.
   */
  run(msg: CommandMessage, args: any) {
    throw new Error('Missing functionality on [Command.run]');
  }
}
