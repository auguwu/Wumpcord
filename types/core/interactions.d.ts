/**
 * Copyright (c) 2020 August
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

import { Client as WebSocketClient } from '.';
import { Collection } from '@augu/immutable';
import { Base } from './discord';

/**
 * Package to build slash commands with Discord's Interactions API
 * @see [Documentation](https://discord.com/developers/docs/interactions/slash-commands)
 */
export namespace interactions {

  /**
   * Represents a parent or subcommand to run a interaction command with Discord
   */
  export class Command extends Base {
    constructor(data: any);

    public description: string;
    public options: interactions.InteractionCommandOption[];
    public isGuild: boolean;
    public name: string;
  }

  /**
   * Represents a option of a [InteractionCommand] instance
   */
  class InteractionCommandOption {
    constructor(data: any);

    public description: string;
    public required: boolean;
    public choices: any[];
    public options: InteractionCommandOption[];
    public default: boolean;
    public name: string;
    public type: number;
  }

  /**
   * Helper utility class to create interaction commands
   */
  export class InteractionHelper {
    constructor(client: WebSocketClient, id: string);

    public globalCommands: Collection<Command>;
    public guildCommands: Collection<Command>;
    public commands: Collection<Command>;
    public id: string;

    public getGuildCommands(guildID: string): Promise<Command[]>;
    public getGlobalCommands(): Promise<Command[]>;
    public createGuildCommand(guildID: string, metadata: any): Promise<Command>;
    public createGlobalCommand(metadata: any): Promise<Command>;
    public editGlobalCommand(id: string, metadata: any): Promise<Command>;
    public editGuildCommand(guildID: string, commandID: string, metadata: any): Promise<Command>;
    public deleteGlobalCommand(id: string): Promise<void>;
    public deleteGuildCommand(guildID: string, commandID: string): Promise<void>;
    public createInteractionResponse(id: string, token: string, type: number, data?: any): Promise<void>;
    public deleteOriginalInteraction(token: string, type: number, data?: any): Promise<void>;
    public editOriginalInteraction(token: string, type: number, data?: any): Promise<void>;
  }
}
