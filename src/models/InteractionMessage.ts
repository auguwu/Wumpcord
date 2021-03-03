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
import type { AnyChannel, MessageContentOptions, TextableChannel, AllowedMentions } from '../types';
import type { APIEmbed, APIUser } from 'discord-api-types';
import { User } from './User';
import InteractionClient from '../interactions/InteractionClient';
import Util from '../util';

/** Represents the metadata of a [InteractionMessage] */
interface APIInteractionMessage {
  mention_roles: string[];
  command_id: string;
  channel_id: string;
  timestamp: string;
  guild_id: string;
  mentions: User[];
  content: string;
  author: APIUser;
}

type OriginalInteractionMessageContentOptions = Omit<MessageContentOptions, 'reply' | 'attachments' | 'embed' | 'tts'> & {
  embeds?: APIEmbed[];
};

type InteractionMessageContentOptions = Omit<MessageContentOptions, 'reply' | 'attachments' | 'embed'> & {
  embeds?: APIEmbed[];
  hidden?: boolean;
};

type OriginalInteractionMessageContent = string | OriginalInteractionMessageContentOptions;
type InteractionMessageContent = string | InteractionMessageContentOptions;

interface RESTPostAPIApplicationResponse {
  allowed_mentions?: AllowedMentions;
  content?: string;
  embeds?: APIEmbed[];
  flags?: number;
  tts?: boolean;
}

/**
 * Represents a partial [Message] instance for interactions
 */
export class InteractionMessage<C extends AnyChannel = TextableChannel> {
  public mentionRoles!: string[];
  public commandID!: string;
  public channelID!: string;
  public timestamp!: string;
  public mentions!: User[];
  public guildID!: string;
  public content!: string;
  public author!: User;

  #client: InteractionClient;
  #token!: string;

  /**
   * Creates a new [InteractionMessage] instance
   * @param client The [InteractionClient] attached
   * @param data The data supplied from Discord
   */
  constructor(client: InteractionClient, data: Partial<APIInteractionMessage> & { token: string }) {
    this.#client = client;
    this.patch(data);
  }

  patch(data: Partial<APIInteractionMessage> & { token: string }) {
    if (data.mention_roles !== undefined)
      this.mentionRoles = data.mention_roles;

    if (data.channel_id !== undefined)
      this.channelID = data.channel_id;

    if (data.command_id !== undefined)
      this.commandID = data.command_id;

    if (data.timestamp !== undefined)
      this.timestamp = data.timestamp;

    if (data.mentions !== undefined)
      this.mentions = data.mentions;

    if (data.content !== undefined)
      this.content = data.content;

    if (data.author !== undefined)
      this.author = this.#client.users.add(new User(this.#client, data.author));

    this.#token = data.token!;
  }

  /** Returns the channel that executed the interaction command */
  get channel() {
    return this.#client.channels.get<C>(this.channelID) as C;
  }

  /** Returns the guild that executed the interaction command */
  get guild() {
    return this.#client.guilds.get(this.guildID);
  }

  private _formatMessage(content: InteractionMessageContent, options?: InteractionMessageContentOptions) {
    const data: RESTPostAPIApplicationResponse = {};

    if (typeof content === 'string' && options === undefined) {
      data.content = content;
      return data;
    } else if (Util.isObject(content) && options === undefined) {
      if (content.mentions !== undefined)
        data.allowed_mentions = Util.formatAllowedMentions(content.mentions, this.#client);

      if (content.content !== undefined)
        data.content = content.content;

      if (content.hidden !== undefined)
        data.flags = 1 << 6;

      if (content.embeds !== undefined)
        data.embeds = content.embeds;

      if (content.tts !== undefined)
        data.tts = content.tts;
    } else if (typeof content === 'string' && (options !== undefined && Util.isObject(options))) {
      data.content = content;

      if (options.mentions !== undefined)
        data.allowed_mentions = Util.formatAllowedMentions(options.mentions, this.#client);

      if (options.hidden !== undefined)
        data.flags = 1 << 6;

      if (options.embeds !== undefined)
        data.embeds = options.embeds;

      if (options.tts !== undefined)
        data.tts = options.tts;
    } else {
      throw new SyntaxError('Missing content or embed to send');
    }

    return data;
  }

  /**
   * Sends a message to create a followup message
   * @param content The content to send
   * @param options Additional options, if any
   */
  send(content: InteractionMessageContent, options?: InteractionMessageContentOptions) {
    const data = this._formatMessage(content, options);

    return this.#client.rest.dispatch<void, RESTPostAPIApplicationResponse>({
      endpoint: `/webhooks/${this.#client.user.id}/${this.#token}`,
      method: 'POST',
      data
    });
  }

  /**
   * Edits the original interaction message, if any
   * @param content The content to send
   * @param options Additional options, if any
   */
  edit(content: OriginalInteractionMessageContent, options?: OriginalInteractionMessageContentOptions) {
    const data = this._formatMessage(content, options) as Omit<RESTPostAPIApplicationResponse, 'tts'>;
    return this.#client.interactions.editOriginalInteraction(this.#token, 4, data);
  }

  /**
   * Deletes the original interaction, if any
   */
  delete() {
    return this.#client.interactions.deleteOriginalInteraction(this.#token, 4);
  }
}
