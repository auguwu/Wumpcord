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

import type { APIMessage, APIWebhook, RESTPatchAPIWebhookJSONBody, RESTPostAPIWebhookWithTokenJSONBody } from 'discord-api-types';
import type { MessageContentOptions, MessageFile } from '../types';
import type WebSocketClient from '../gateway/WebSocketClient';
import type { Readable } from 'stream';
import { WebhookTypes } from '../Constants';
import { Message } from './Message';
import { User } from './User';
import Util from '../util';
import Base from './Base';

interface ModifyWebhookOptions {
  channelID?: string;
  image?: Buffer | Readable;
  name?: string;
  auth?: boolean;
}

interface SendWebhookMessageOptions extends MessageContentOptions {
  wait?: boolean;
}

type SendWebhookMessage = string | SendWebhookMessageOptions;

export default class Webhook extends Base<APIWebhook> {
  public applicationID!: string | null;
  public channelID!: string;
  public guildID!: string;
  private client: WebSocketClient;
  public avatar!: string | null;
  public token!: string;
  public type!: string;
  public name!: string | null;
  public user!: User;

  constructor(client: WebSocketClient, data: APIWebhook) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  patch(data: APIWebhook) {
    if (data.application_id !== undefined)
      this.applicationID = data.application_id;

    if (data.channel_id !== undefined)
      this.channelID = data.channel_id;

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.avatar !== undefined)
      this.avatar = data.avatar;

    if (data.token !== undefined)
      this.token = data.token;

    if (data.type !== undefined)
      this.type = WebhookTypes[data.type];

    if (data.name !== undefined)
      this.name = data.name;

    // Let's not populate cache with webhook users
    if (data.user !== undefined)
      this.user = new User(this.client, data.user);
  }

  fetch() {
    return this.client.rest.dispatch<APIWebhook>({
      endpoint: `/webhooks/${this.id}`,
      method: 'GET'
    }).then(d => {
      this.patch(d);
      return this;
    });
  }

  async modify(options: ModifyWebhookOptions) {
    if (!options) throw new TypeError('Missing `options` object');
    if (!Util.isObject(options)) throw new TypeError(`Expected \`object\`, but received ${typeof options}`);
    if (!Object.keys(options).length) throw new TypeError('Cannot pass in an empty object.');

    if (options.image && (!Util.isReadableStream(options.image) || !Buffer.isBuffer(options)))
      throw new TypeError(`[options.image] requires a \`ReadableStream\` or \`Buffer\` object, received ${typeof options.image}`);

    if (options.name && typeof options.name !== 'string')
      throw new TypeError(`[options.name] requires a \`string\`, but received ${typeof options.name}`);

    if (options.channelID && typeof options.channelID !== undefined)
      throw new TypeError(`[options.channelID] requires a \`string\` but received ${typeof options.channelID}`);

    if (options.auth && typeof options.auth !== 'boolean')
      throw new TypeError(`[options.auth] requires a \`boolean\` value, but received ${typeof options.auth}`);

    if (options.auth === true && options.channelID !== undefined)
      throw new TypeError('[options.auth | options.channelID] Can\'t use `channelID` and `auth` at the same time. (https://discord.com/developers/docs/resources/webhook#modify-webhook-with-token)');

    let image: Buffer | undefined = undefined;
    if (options.image !== undefined) {
      if (Util.isReadableStream(options.image)) image = await Util.readableToBuffer(options.image);
      if (Buffer.isBuffer(options.image)) image = options.image;
    }

    let file: MessageFile | undefined = image !== undefined ? { file: image } : undefined;
    return this.client.rest.dispatch<APIWebhook, RESTPatchAPIWebhookJSONBody>({
      endpoint: `/webhooks/${this.id}${options.auth ? `/${this.token}` : ''}`,
      method: 'GET',
      file,
      data: {
        channel_id: options.channelID, // eslint-disable-line camelcase
        name: options.name
      }
    });
  }

  send(content: SendWebhookMessage, options?: SendWebhookMessageOptions) {
    if (!this.token) throw new TypeError('Missing `token` value in this [Webhook]');

    const message = Util.formatMessage(this.client, content, options);
    let wait: boolean = false;

    if (Util.isObject(content))
      wait = content.wait ?? false;
    else if (Util.isObject(options))
      wait = options.wait ?? false;
    else
      wait = false;

    return this.client.rest.dispatch<APIMessage | void, RESTPostAPIWebhookWithTokenJSONBody>({
      endpoint: `/webhooks/${this.id}/${this.token}${wait === true ? '?wait=true' : ''}`,
      method: 'POST',
      file: message.file,
      data: message
    }).then((data) => data === void 0 ? undefined : new Message(this.client, data));
  }

  toString() {
    return `[wumpcord.Webhook<U: ${this.user?.tag ?? 'Unknown Webhook#0000'}>]`;
  }
}
