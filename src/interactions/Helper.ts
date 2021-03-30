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

import type * as interactions from './types';
import type InteractionClient from './InteractionClient';
import ApplicationCommand from './Command';

/**
 * Represents the helper to instrument slash commands. This is binded to `interactions`
 * on the [[InteractionClient]].
 */
export default class InteractionHelper {
  private client: InteractionClient;
  constructor(client: InteractionClient) {
    this.client = client;
  }

  /**
   * Retrives all the global slash commands available to the application (which is your bot)
   * @returns A list of commands available
   */
  getGlobalCommands() {
    return this.client.rest.dispatch<interactions.ApplicationCommand[]>({
      endpoint: `/applications/${this.client.user.id}/commands`,
      method: 'GET'
    }).then(commands => commands.map(command => new ApplicationCommand({ is_guild: false, ...command }))); // eslint-disable-line camelcase
  }

  /**
   * Retrives all the slash commands available from a guild.
   * @param guildID The guild's ID
   * @returns A list of slash commands available
   */
  getGuildCommands(guildID: string) {
    return this.client.rest.dispatch<interactions.ApplicationCommand[]>({
      endpoint: `/applications/${this.client.user.id}/guilds/${guildID}/commands`,
      method: 'GET'
    }).then(commands =>
      commands.map(command => new ApplicationCommand({ is_guild: true, ...command })) // eslint-disable-line camelcase
    ).catch(error => {
      if (error.message.indexOf('Missing Access') !== -1) throw new TypeError('Application must be invited in guild using the "applications.commands" scope.');

      throw error;
    });
  }

  /**
   * Creates a new guild slash commands that is available to use automatically.
   * @param guildID The guild's ID
   * @param metadata The metadata of the slash command
   * @returns The created slash command or a [[DiscordRESTError]] of what happened.
   */
  createGuildCommand(guildID: string, metadata: interactions.IApplicationCommand) {
    return this.client.rest.dispatch<interactions.ApplicationCommand>({
      endpoint: `/applications/${this.client.user.id}/guilds/${guildID}/commands`,
      method: 'POST',
      data: metadata
    }).then(data => new ApplicationCommand({ is_guild: true, ...data }));
  }

  /**
   * Creates a new global slash command that has a TTL (time-to last) of 1 hour and is not added automatically
   * @param metadata The metadata of the slash command
   * @returns The created slash command or a [[DiscordRESTError]] of what happened.
   */
  createGlobalCommand(metadata: interactions.IApplicationCommand) {
    return this.client.rest.dispatch<interactions.ApplicationCommand>({
      endpoint: `/applications/${this.client.user.id}/commands`,
      method: 'POST',
      data: metadata
    }).then(data => {
      const command = new ApplicationCommand({ is_guild: false, ...data });
      return command;
    });
  }

  /**
   * Edits a global slash command with new properties
   * @param id The slash command's ID
   * @param metadata The metadata to edit
   * @returns The updated slash command or a [[DiscordRESTError]] of what happened.
   */
  editGlobalCommand(id: string, metadata: Partial<interactions.IApplicationCommand>) {
    return this.client.rest.dispatch<interactions.ApplicationCommand>({
      endpoint: `/applications/${this.client.user.id}/commands/${id}`,
      method: 'PATCH',
      data: metadata
    }).then(data => new ApplicationCommand({ is_guild: false, ...data }));
  }

  /**
   * Edits a guild slash command with new properties
   * @param guildID The guild's ID
   * @param commandID The command's ID
   * @param metadata THe metadata to edit
   * @returns The updated slash command or a [[DiscordRESTError]] of what happened.
   */
  editGuildCommand(guildID: string, commandID: string, metadata: Partial<interactions.IApplicationCommand>) {
    return this.client.rest.dispatch<interactions.ApplicationCommand>({
      endpoint: `/applications/${this.client.user.id}/guilds/${guildID}/commands/${commandID}`,
      method: 'patch',
      data: metadata
    }).then(data => new ApplicationCommand({ is_guild: true, ...data }));
  }

  /**
   * Deletes a global slash command.
   * @param id The command's ID
   */
  deleteGlobalCommand(id: string) {
    return this.client.rest.dispatch<void>({
      endpoint: `/applications/${this.client.user.id}/commands/${id}`,
      method: 'delete'
    });
  }

  /**
   * Deletes a guild slash command
   * @param guildID The guild's ID
   * @param commandID The command's ID
   */
  deleteGuildCommand(guildID: string, commandID: string) {
    return this.client.rest.dispatch<void>({
      endpoint: `/applications/${this.client.user.id}/guilds/${guildID}/commands/${commandID}`,
      method: 'delete'
    });
  }

  /**
   * External method to create a interaction response, read more [here](https://discord.com/developers/docs/interactions/slash-commands#interaction-response)
   * @param id The interaction's ID from the `interactionReceive` event or from the `raw` event
   * @param token The token provided from the `interactionReceive` event or from the `raw` event
   * @param type The interaction type, note that `2` and `3` are deprecated.
   * @param data The data payload to send ([more information here](https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionapplicationcommandcallbackdata))
   */
  createInteractionResponse(id: string, token: string, type: number, data?: any) {
    return this.client.rest.dispatch<any>({
      endpoint: `/interactions/${id}/${token}/callback`,
      method: 'post',
      data: {
        type,
        data
      }
    });
  }

  /**
   * External method to delete the original interaction response
   * @param token The token provided from the `interactionReceive` event or from the `raw` event
   * @param type The interaction type, note that `2` and `3` are deprecated.
   * @param data The data payload to send ([more information here](https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionapplicationcommandcallbackdata))
   */
  deleteOriginalInteraction(token: string, type: number, data?: any) {
    return this.client.rest.dispatch({
      endpoint: `/webhooks/${this.client.user.id}/${token}/messages/@original`,
      method: 'DELETE',
      data: {
        type,
        data
      }
    });
  }

  /**
   * External method to edit the original interaction response
   * @param token The token provided from the `interactionReceive` event or from the `raw` event
   * @param type The interaction type, note that `2` and `3` are deprecated.
   * @param data The data payload to send ([more information here](https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionapplicationcommandcallbackdata))
   */
  editOriginalInteraction(token: string, type: number, data?: any) {
    return this.client.rest.dispatch({
      endpoint: `/webhooks/${this.client.user.id}/${token}/messages/@original`,
      method: 'PATCH',
      data: {
        type,
        data
      }
    });
  }
}
