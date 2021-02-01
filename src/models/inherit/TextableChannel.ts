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

import { APIMessage, APIPartialChannel, APIWebhook, RESTPostAPIChannelMessageJSONBody, RESTPostAPIChannelMessagesBulkDeleteJSONBody } from 'discord-api-types';
import type { MessageContent, MessageContentOptions } from '../../types';
import MessageCollector, { Filter } from '../util/MessageCollector';
import type { PermissionOverwrite } from '../PermissionOverwrite';
import ChannelMessagesManager from '../../managers/ChannelMessagesManager';
import type { GuildMember } from '..';
import { Permissions } from '../../Constants';
import WebSocketClient from '../../gateway/WebSocketClient';
import { Message } from '../Message';
import { Channel } from '../Channel';
import Permission from '../../util/Permissions';
import Util from '../../util';
import { Guild } from '../Guild';
import { Webhook } from '../Webhook';

interface GetMessagesOptions {
  around?: string;
  before?: string;
  after?: string;
}

export default class TextableChannel<T extends APIPartialChannel> extends Channel {
  public collector: MessageCollector;
  public messages: ChannelMessagesManager;
  public client: WebSocketClient;

  constructor(client: WebSocketClient, data: T) {
    super(data);

    this.collector = new MessageCollector(client, <any> this);
    this.messages = new ChannelMessagesManager(client);
    this.client = client;
  }

  await(userID: string, filter: Filter, time: number = 30000) {
    return this.collector.await(filter, userID, time);
  }

  bulkDelete(messages: (string | Message)[]) {
    if (!Array.isArray(messages)) throw new TypeError('Expected a list of messages or messages IDs');
    if (messages.some(val => typeof val !== 'string' || !((<any> val) instanceof Message)))
      throw new TypeError('Some messages were not a string of message IDs or instances of \`Message\`.');

    const bulk = messages.map(val => val instanceof Message ? val.id : val);

    if (!bulk.length) return Promise.resolve(0);
    if (bulk.length === 1) {
      return this.client.rest.dispatch<void>({
        endpoint: `/channels/${this.id}/messages/${bulk[0]}`,
        method: 'DELETE'
      }).then(() => 1);
    }

    return this.client.rest.dispatch<void, RESTPostAPIChannelMessagesBulkDeleteJSONBody>({
      endpoint: `/channels/${this.id}/messages/bulk-delete`,
      method: 'POST',
      data: {
        messages: bulk
      }
    }).then(() => bulk.length);
  }

  getMessages(amount: number, options?: GetMessagesOptions) {
    if (isNaN(amount)) throw new TypeError(`Amount "${amount}" was not a number`);
    if (amount < 2 || amount > 100) throw new TypeError('The amount must be lower/equal to 2 or higher/equal to 100');

    const query = Util.objectToQuery({
      limit: amount,
      ...(options !== undefined ? options : {})
    });

    return this.client.rest.dispatch<APIMessage[]>({
      endpoint: `/channels/${this.id}/messages${query}`,
      method: 'GET'
    }).then(data => data.map(val => new Message(this.client, val)));
  }

  sendTyping() {
    return this.client.rest.dispatch<void>({
      endpoint: `/channels/${this.id}/typing`,
      method: 'POST'
    });
  }

  getPins() {
    return this.client.rest.dispatch<APIMessage[]>({
      endpoint: `/channels/${this.id}/messages/pins`,
      method: 'GET'
    }).then(data => data.map(val => new Message(this.client, val)));
  }

  permissionsOf(memberID: string) {
    const self = this as any;
    if (!self.guild) throw new TypeError(`TextableChannel "${this.constructor.name}" is not a Guild channel.`);

    const guild: Guild = self.guild;
    const member: GuildMember | null = self.guild.members.get(memberID);
    if (member === null) return new Permission('0');

    let permission = member.permission.allow;
    if (permission & Permissions.administrator) return new Permission(String(Permissions.all));

    let overwrite: PermissionOverwrite = (this as any).permissionOverwrites.get(guild?.id ?? self.guildID);
    if (overwrite) permission = (permission & ~overwrite.permissions.denied) | overwrite.permissions.allow;

    let deny = 0;
    let allow = 0;
    for (const role of member.roles) {
      if ((overwrite = self.permissionOverwrites.get(role.id)) !== undefined) {
        deny |= overwrite.permissions.denied;
        allow |= overwrite.permissions.allow;
      }
    }

    permission = (permission & ~deny) | allow;
    overwrite = self.permissionOverwrites.get(memberID);

    if (overwrite !== undefined) permission = (permission & ~overwrite.permissions.denied) | overwrite.permissions.allow;
    return new Permission(String(permission));
  }

  getWebhooks() {
    return this.client.rest.dispatch<APIWebhook[]>({
      endpoint: `/channels/${this.id}/webhooks`,
      method: 'GET'
    }).then(webhooks => webhooks.map(d => new Webhook(this.client, d)));
  }

  send(content: MessageContent, options?: MessageContentOptions) {
    const data = Util.formatMessage(this.client, content, options);
    const file = data.file;

    delete data.file;

    return this.client.rest.dispatch<APIMessage, RESTPostAPIChannelMessageJSONBody>({
      endpoint: `/channels/${this.id}/messages`,
      method: 'POST',
      file,
      data
    }).then(d => new Message(this.client, d));
  }
}
