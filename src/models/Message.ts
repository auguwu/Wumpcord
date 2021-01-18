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

import type { TextableChannel, MessageContentOptions } from '../types';
import type WebSocketClient from '../gateway/WebSocketClient';
import { GuildEmoji, GuildMember } from '.';
import { Attachment } from './Attachment';
import { User } from './User';
import Base from './Base';
import Util from '../util';

import {
  APIEmbed,
  APIMessage,
  APIMessageReference,
  APIReaction,
  APIMessageActivity,
  APIMessageApplication,
  RESTPostAPIChannelMessageCrosspostResult,
  RESTGetAPIChannelMessageReactionsResult,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageJSONBody
} from 'discord-api-types';

type EditedMessageContent = string | Omit<MessageContentOptions, 'file'>;
type ReplyMessageContent = string | Omit<MessageContentOptions, 'reply'>;

interface GetReactionsOptions {
  before?: string;
  after?: string;
  limit?: number;
}

export class Message<C extends TextableChannel = TextableChannel> extends Base<APIMessage> {
  public referencedMessage!: Message | null;
  public editedTimestamp!: Date | null;
  public mentionEveryone!: boolean;
  public mentionChannels!: string[];
  public mentionRoles!: string[];
  public application!: APIMessageApplication;
  public attachments!: Attachment[];
  public reactions!: APIReaction[];
  public reference!: APIMessageReference;
  public channelID!: string;
  public timestamp!: Date;
  public webhookID!: string;
  public mentions!: string[];
  public activity!: APIMessageActivity;
  public content!: string;
  public guildID!: string;
  private client: WebSocketClient;
  public member!: GuildMember;
  public embeds!: APIEmbed[];
  public pinned!: boolean;
  public author!: User;
  public flags!: number;
  public edits: Message[];
  public type!: number;
  public tts!: boolean;

  constructor(client: WebSocketClient, data: APIMessage) {
    super(data.id);

    this.client = client;
    this.edits = [];

    this.patch(data);
  }

  patch(data: APIMessage) {
    if (data.edited_timestamp !== undefined)
      this.editedTimestamp = data.edited_timestamp !== null ? new Date(data.edited_timestamp) : null;

    if (data.mention_channels !== undefined)
      this.mentionChannels = data.mention_channels.map(c => c.id);

    if (data.mention_everyone !== undefined)
      this.mentionEveryone = data.mention_everyone;

    if (data.mention_roles !== undefined)
      this.mentionRoles = data.mention_roles;

    if (data.message_reference !== undefined)
      this.reference = data.message_reference;

    if (data.channel_id !== undefined)
      this.channelID = data.channel_id;

    if (data.mentions !== undefined)
      this.mentions = data.mentions.map(r => r.id);

    if (data.guild_id !== undefined)
      this.guildID = data.guild_id;

    if (data.member !== undefined)
      this.member = new GuildMember(this.client, data.member);

    if (data.embeds !== undefined)
      this.embeds = data.embeds;

    if (data.author !== undefined)
      this.author = this.client.users.add(new User(this.client, data.author));

    if (data.flags !== undefined)
      this.flags = data.flags;

    if (data.tts !== undefined)
      this.tts = data.tts;

    if (data.timestamp !== undefined)
      this.timestamp = new Date(data.timestamp);

    if (data.reactions !== undefined)
      this.reactions = data.reactions;

    if (data.pinned !== undefined)
      this.pinned = data.pinned;

    if (data.webhook_id !== undefined)
      this.webhookID = data.webhook_id;

    if (data.type !== undefined)
      this.type = data.type;

    if (data.activity !== undefined)
      this.activity = data.activity;

    if (data.application !== undefined)
      this.application = data.application;

    if (data.content !== undefined)
      this.content = data.content;

    if (data.referenced_message !== undefined)
      this.referencedMessage = data.referenced_message !== null ? new Message(this.client, data.referenced_message) : null;

    this.edits.unshift(this);
  }

  get edited() {
    return this.edits[this.edits.length - 1] ?? null;
  }

  get guild() {
    return this.client.guilds.get(this.guildID);
  }

  get channel() {
    return this.client.channels.get<C>(this.channelID) as C;
  }

  delete() {
    const channelID = this.channel !== null ? this.channel.id : this.channelID;
    return this.client.rest.dispatch<void>({
      endpoint: `/channels/${channelID}/messages/${this.id}`,
      method: 'DELETE'
    });
  }

  crosspost() {
    const channel = this.channel !== null ? this.channel.id : this.channelID;

    return this.client.rest.dispatch<RESTPostAPIChannelMessageCrosspostResult>({
      endpoint: `/channels/${channel}/messages/${this.id}/crosspost`,
      method: 'POST'
    }).then(data => new Message(this.client, data));
  }

  react(reaction: string | GuildEmoji) {
    let emote!: string;

    if (reaction instanceof GuildEmoji)
      emote = `:${reaction.name}:${reaction.id}`;
    else if (reaction === decodeURI(reaction))
      emote = reaction;
    else if (reaction.startsWith(':'))
      emote = reaction;
    else
      throw new TypeError('Emojis must be encoded as `:name:id`');

    return this.client.rest.dispatch<void>({
      endpoint: `/channels/${this.channelID}/messages/${this.id}/reactions/${emote}/@me`,
      method: 'PUT'
    });
  }

  unreact(reaction: string | GuildEmoji) {
    let emote!: string;

    if (reaction instanceof GuildEmoji)
      emote = `:${reaction.name}:${reaction.id}`;
    else if (reaction === decodeURI(reaction))
      emote = reaction;
    else if (reaction.startsWith(':'))
      emote = reaction;
    else
      throw new TypeError('Emojis must be encoded as `:name:id`');

    return this.client.rest.dispatch<void>({
      endpoint: `/channels/${this.channelID}/messages/${this.id}/reactions/${emote}/@me`,
      method: 'DELETE'
    });
  }

  getReactions(reaction: string | GuildEmoji, opts?: GetReactionsOptions) {
    if (opts !== undefined && !Util.isObject(opts)) throw new TypeError(`Expected \`object\`, but received ${typeof opts}`);

    const options = Util.merge(opts, { limit: 100 })!;
    if (options.before && typeof options.before !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.before}`);
    if (options.after && typeof options.after !== 'string') throw new TypeError(`Expected \`string\`, but received ${typeof options.after}`);
    if (options.limit) {
      if (typeof options.limit !== 'number') throw new TypeError(`Expected \`number\`, but gotten ${typeof options.limit}`);
      if (options.limit < 2 || options.limit > 100) throw new RangeError('Limit of reactions must be 2-100.');
    }

    let emote!: string;
    if (reaction instanceof GuildEmoji) emote = reaction.id;
    else {
      if (reaction === decodeURI(reaction)) emote = reaction;
    }

    const url = `/channels/${this.channelID}/messages/${this.id}/reactions/${emote}/@me${Util.objectToQuery(options)}`;
    return this.client.rest.dispatch<RESTGetAPIChannelMessageReactionsResult>({
      endpoint: url,
      method: 'GET'
    }).then(users => users.map(d => new User(this.client, d)));
  }

  deleteReactions() {
    return this.client.rest.dispatch<void>({
      endpoint: `/channels/${this.channelID}/messages/${this.id}/reactions`,
      method: 'DELETE'
    });
  }

  edit(content: EditedMessageContent, options?: Omit<MessageContentOptions, 'file'>) {
    const data = Util.formatMessage(this.client, content, options);
    if (data.file !== undefined) delete data.file;

    return this.client.rest.dispatch<APIMessage, RESTPatchAPIChannelMessageJSONBody>({
      endpoint: `/channels/${this.channelID}/messages/${this.id}`,
      method: 'PATCH',
      data
    }).then(data => new Message(this.client, data));
  }

  reply(content: ReplyMessageContent, options?: Omit<MessageContentOptions, 'reply'>) {
    let message: MessageContentOptions = {
      reply: this.id
    };

    if (typeof content === 'string') {
      const data = Util.formatMessage(this.client, {
        reply: this.id,
        content: content
      });

      return this.client.rest.dispatch<APIMessage, RESTPostAPIChannelMessageJSONBody>({
        endpoint: `/channels/${this.channelID}/messages`,
        method: 'POST',
        data
      }).then(data => new Message(this.client, data));
    }

    if (Util.isObject(content) && Util.isObject(options)) throw new Error('Cannot have `content` and `options` as message options');
    if (Util.isObject(content)) message = { reply: this.id, ...content };
    if (Util.isObject(options)) message = { reply: this.id, ...options };

    const data = Util.formatMessage(this.client, message);
    let file = data.file;
    delete data.file;

    console.log(data);
    return this.client.rest.dispatch<APIMessage, RESTPostAPIChannelMessageJSONBody>({
      endpoint: `/channels/${this.channelID}/messages`,
      method: 'POST',
      data,
      file
    }).then(data => new Message(this.client, data));
  }

  pin() {
    return this.client.rest.dispatch<void>({
      endpoint: `/channels/${this.id}/pins/${this.id}`,
      method: 'PUT'
    });
  }

  unpin() {
    return this.client.rest.dispatch<void>({
      endpoint: `/channels/${this.id}/pins/${this.id}`,
      method: 'DELETE'
    });
  }
}
