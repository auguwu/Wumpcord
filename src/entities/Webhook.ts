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

import type { APIEmbed, APIMessage, APIWebhook, RESTPatchAPIWebhookJSONBody, RESTPatchAPIWebhookWithTokenJSONBody, RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPostAPIWebhookWithTokenJSONBody } from 'discord-api-types';
import type { MessageContentOptions } from '../types';
import { WebSocketClient } from '../Client';
import type { Readable } from 'stream';
import { WebhookTypes } from '../Constants';
import { BaseEntity } from './BaseEntity';
import { Snowflake } from '../util/Snowflake';
import { isObject } from '@augu/utils';
import { User } from './User';
import Util from '../util';

/**
 * https://discord.com/developers/docs/resources/webhook#modify-webhook-json-params
 */
interface ModifyWebhookOptions {
  /**
   * The new channel ID the webhook should be moved to. This property is omitted when
   * `auth` is `true`.
   */
  channelID?: string;

  /**
   * The image for the avatar. It can use the following patterns:
   *
   * - `string` from [[Util.bufferToBase64]]
   * - `Buffer` from reading a image buffer
   * - `Readable` - A readable stream from fs.createReadStream.
   *    - Notice: Using [[Readable]] streams is O(N) complexity, so try to convert it yourself
   *      or use `fs.readFileSync`.
   */
  image?: string | Buffer | Readable;

  /**
   * If we should call `/webhooks/{webhook.id}/{webhook.token}` instead of `/webhooks/{webhook.id}`.
   */
  auth?: boolean;

  /**
   * The name of the webhook
   */
  name?: string;
}

interface SendWebhookMessageOptions extends Omit<MessageContentOptions, 'embed'> {
  /**
   * Override the avatar URL for the webhook to send as
   */
  avatarUrl?: string;

  /**
   * Override the username for the webhook to send as
   */
  username?: string;

  /**
   * Up to 10 embeds to send from this webhook
   */
  embeds?: APIEmbed[];

  /**
   * Waits for server confirmation of the message send response
   */
  wait?: boolean;
}

/**
 * Type alias for [[Webhook#send]]
 */
type SendWebhookMessage = string | SendWebhookMessageOptions;

/**
 * https://discord.com/developers/docs/resources/webhook#webhook-resource
 */
export class Webhook extends BaseEntity<APIWebhook> {
  /**
   * The bot or OAuth2 application that created this webhook, maybe `null` if not
   * created by a bot or OAuth2 application.
   */
  public applicationID!: string | null;

  /**
   * The channel ID this webhook belongs to
   */
  public channelID!: Snowflake;

  /**
   * The guild ID this webhook is for
   */
  public guildID?: Snowflake;

  /**
   * The [[WebSocketClient]] that is attached to this webhook
   */
  public client: WebSocketClient;

  /**
   * The avatar of this webhook, maybe `null` if not specified
   */
  public avatar!: string | null;

  /**
   * The secure token for this [[Webhook]]
   */
  public token?: string;

  /**
   * The type of webhook this is (https://discord.com/developers/docs/resources/webhook#webhook-object-webhook-types)
   */
  public type!: string;

  /**
   * The name of the webhook, maybe `null` if not specified
   */
  public name!: string | null;

  /**
   * The user this webhook created
   */
  public user?: User;

  constructor(client: WebSocketClient, data: APIWebhook) {
    super(data.id);

    this.client = client;
    this.patch(data);
  }

  /** @inheritdoc */
  patch(data: APIWebhook) {
    if (data.application_id !== undefined)
      this.applicationID = data.application_id;

    if (data.channel_id !== undefined)
      this.channelID = new Snowflake(data.channel_id);

    if (data.guild_id !== undefined)
      this.guildID = new Snowflake(data.guild_id);

    if (data.avatar !== undefined)
      this.avatar = data.avatar;

    if (data.type !== undefined)
      this.type = WebhookTypes[data.type]!;

    if (data.name !== undefined)
      this.name = data.name;

    if (data.user !== undefined)
      this.user = new User(this.client, data.user);
  }

  /**
   * Fetch this [[Webhook]] and returns itself with newly patched data ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#get-webhook))
   * @param auth If we should use [`/webhooks/{webhook.id}/{webhook.token}`](https://discord.com/developers/docs/resources/webhook#get-webhook-with-token) instead of
   * [`/webhooks/{webhook.id}`](https://discord.com/developers/docs/resources/webhook#get-webhook). It's still the same, but if you want to, it's there.
   */
  fetch(auth: boolean = false) {
    return this.client.rest.dispatch<void, APIWebhook>({
      endpoint: `/webhooks/${this.id}${auth ? `/${this.token}` : ''}`,
      method: 'GET'
    }).then(data => {
      this.patch(data);
      return this;
    });
  }

  /**
   * Modifies this webhook and returns this webhook with new data ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#modify-webhook-with-token))
   * @param options The options to use
   */
  async modify(options: ModifyWebhookOptions = {}) {
    if (!isObject<ModifyWebhookOptions>(options))
      throw new TypeError(`Expected \`object\`, but received ${typeof options === 'object' ? 'array/null' : typeof options}`);

    if (options.image && (!Util.isReadableStream(options.image) || !Buffer.isBuffer(options.image) || typeof options.image !== 'string'))
      throw new TypeError(`[options.image] requires a readable string, Buffer, or a string (using Util.bufferToBase64); received \`${typeof options.image}\``);

    if (options.auth === true && options.channelID !== undefined)
      throw new TypeError('Cannot use `auth` and `channelID` at the same time.');

    if (options.auth === true && this.token !== undefined)
      throw new TypeError('Cannot use `auth` with this webhook having a secure token.');

    let image: string | undefined = undefined;
    if (options.image !== undefined) {
      if (Util.isReadableStream(options.image)) {
        const buf = await Util.readableToBuffer(options.image);
        image = Util.bufferToBase64(buf);
      } else if (Buffer.isBuffer(options.image)) {
        image = Util.bufferToBase64(options.image);
      } else {
        image = options.image;
      }
    }

    return this.client.rest.dispatch<RESTPatchAPIWebhookJSONBody, APIWebhook>({
      endpoint: `/webhooks/${this.id}${options.auth ? `/${this.token}` : ''}`,
      method: 'GET',
      data: {
        channel_id: options.channelID as `${bigint}`, // stupid hack to not collide with Wumpcord.Snowflake
        avatar: image,
        name: options.name
      }
    }).then(data => {
      this.patch(data);
      return this;
    });
  }

  /**
   * Sends a message to the webhook's channel ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#execute-webhook))
   * @param content The content to send, which can be a string or a [[SendWebhookMessageOptions]] object
   * @param options A [[SendWebhookMessageOptions]] object if `content` is a string and need additional metadata to send
   */
  send(content: SendWebhookMessage, options?: SendWebhookMessageOptions): Promise<APIMessage | undefined> {
    if (!this.token)
      throw new TypeError('Missing `token` in this webhook');

    const message = Util.formatMessage(this.client, content, options);
    let wait = false;

    if (isObject<SendWebhookMessageOptions>(options))
      wait = options.wait ?? false;
    else if (isObject<SendWebhookMessageOptions>(content))
      wait = content.wait ?? false;

    // @ts-ignore
    return this.client.rest.dispatch<RESTPostAPIWebhookWithTokenJSONBody, APIMessage | void>({
      endpoint: `/webhooks/${this.id}/${this.token}${wait === true ? '?wait=true' : ''}`,
      method: 'POST',
      file: message.file as any,
      data: {
        avatar_url: typeof content === 'string' ? undefined : typeof options !== 'undefined' ? options.avatarUrl : content.avatarUrl,
        username: typeof content === 'string' ? undefined : typeof options !== 'undefined' ? options.username : content.username,
        ...message
      }
    }).then(data => data === void 0 ? undefined : data);
  }

  /**
   * Deletes this webhook ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#delete-webhook-with-token))
   */
  delete() {
    return this.client.rest.dispatch<void>({
      endpoint: `/webhooks/${this.id}/${this.token}`,
      method: 'DELETE'
    });
  }

  /**
   * Execute a Slack-compatible webhook message, if you're into that or something ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#execute-slackcompatible-webhook))
   * @param content The content to send (this isn't typed due to a lack of documentation)
   * @param wait Waits for server confirmation of the message send response
   */
  sendSlackMessage(content: any, wait: boolean = false) {
    return this.client.rest.dispatch<any>({
      endpoint: `/webhooks/${this.id}/${this.token}/slack${wait ? '?wait=true' : ''}`,
      method: 'GET',
      data: content
    });
  }

  /**
   * Edit a webhook message that it sent ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#edit-webhook-message))
   * @param messageID The message ID
   * @param content The content to send
   * @param options Any additional options
   */
  editMessage(messageID: string, content: string | Omit<SendWebhookMessageOptions, 'wait'>, options?: Omit<SendWebhookMessageOptions, 'wait'>) {
    const message = Util.formatMessage(this.client, content, options);
    return this.client.rest.dispatch<any, APIMessage>({
      endpoint: `/webhooks/${this.id}/${this.token}/messages/${messageID}`,
      method: 'PATCH',
      data: {
        avatar_url: typeof content === 'string' ? undefined : typeof options !== 'undefined' ? options.avatarUrl : content.avatarUrl,
        username: typeof content === 'string' ? undefined : typeof options !== 'undefined' ? options.username : content.username,
        ...message
      }
    });
  }

  /**
   * Deletes a message that was created by a webhook ([`Discord Docs`](https://discord.com/developers/docs/resources/webhook#delete-webhook-message))
   * @param messageID The message ID
   */
  deleteMessage(messageID: string) {
    return this.client.rest.dispatch<void, void>({
      endpoint: `/webhooks/${this.id}/${this.token}/messages/${messageID}`,
      method: 'DELETE'
    });
  }
}
