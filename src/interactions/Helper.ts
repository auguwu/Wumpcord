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
/* eslint-disable camelcase */

import type * as interactions from './types';
import type WebSocketClient from '../gateway/WebSocketClient';
import ApplicationCommand from './Command';

export default class InteractionHelper {
  private client: WebSocketClient;
  constructor(client: WebSocketClient) {
    this.client = client;
  }

  getGlobalCommands() {
    return this.client.rest.dispatch<interactions.ApplicationCommand[]>({
      endpoint: `/applications/${this.client.user.id}/commands`,
      method: 'GET'
    }).then(commands => commands.map(command => new ApplicationCommand({ is_guild: false, ...(command as any) }))); // eslint-disable-line camelcase
  }

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

  createGuildCommand(guildID: string, metadata: interactions.IApplicationCommand) {
    return this.client.rest.dispatch<interactions.ApplicationCommand>({
      endpoint: `/applications/${this.client.user.id}/guilds/${guildID}/commands`,
      method: 'POST',
      data: metadata
    }).then(data => {
      const command = new ApplicationCommand({ is_guild: true, ...data });
      return command;
    });
  }

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

  editGlobalCommand(id: string, metadata: Partial<interactions.IApplicationCommand>) {
    return this.client.rest.dispatch<interactions.ApplicationCommand>({
      endpoint: `/applications/${this.client.user.id}/commands/${id}`,
      method: 'PATCH',
      data: metadata
    }).then(data => {
      const command = new ApplicationCommand({ is_guild: false, ...data });
      return command;
    });
  }

  editGuildCommand(guildID: string, commandID: string, metadata: Partial<interactions.IApplicationCommand>) {
    return this.client.rest.dispatch<interactions.ApplicationCommand>({
      endpoint: `/applications/${this.client.user.id}/guilds/${guildID}/commands/${commandID}`,
      method: 'patch',
      data: metadata
    }).then(data => {
      const command = new ApplicationCommand({ is_guild: true, ...data });
      return command;
    });
  }

  deleteGlobalCommand(id: string) {
    return this.client.rest.dispatch<void>({
      endpoint: `/applications/${this.client.user.id}/commands/${id}`,
      method: 'delete'
    });
  }

  deleteGuildCommand(guildID: string, commandID: string) {
    return this.client.rest.dispatch<void>({
      endpoint: `/applications/${this.client.user.id}/guilds/${guildID}/commands/${commandID}`,
      method: 'delete'
    });
  }

  createInteractionResponse(id: string, token: string, type: number, data?: any) {
    return this.client.rest.dispatch({
      endpoint: `/interactions/${id}/${token}/callback`,
      method: 'post',
      data: {
        type,
        data
      }
    });
  }

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
