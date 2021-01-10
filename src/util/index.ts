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

import type { AllowedMentions, MessageContent, MessageContentOptions, MessageFile } from '../types';
import type WebSocketClient from '../gateway/WebSocketClient';
import * as discord from 'discord-api-types';
import { Readable } from 'stream';

/**
 * All utilities available to Wumpcord
 */
export default class Util {
  constructor() {
    throw new SyntaxError('This class isn\'t supposed to be a constructable class, refrain from using `new`.');
  }

  /**
   * Gets a value from a object if it exists, if it doesn't, it'll use the provided [defaultValue].
   * @param obj The object to get the value from
   * @param prop The property to get the value from
   * @param defaultValue A default value, if provided
   * @returns The value if it exists or the [defaultValue] if it doesn't
   */
  static get<T extends object, K extends keyof T>(obj: T, prop: K, defaultValue: T[K]): T[K] {
    if (obj.hasOwnProperty(prop)) return obj[prop];
    else return defaultValue;
  }

  /**
   * Halts the process asynchronously for an amount of time
   * @param ms The amount of milliseconds to halt
   */
  static sleep(ms: number) {
    return new Promise<unknown>(resolve => setTimeout(resolve, ms));
  }

  /**
   * Merges 2 objects into one
   * @param given The given object
   * @param def The default object
   */
  static merge<T>(given: T, def: T): T {
    if (!given) return def;
    for (const key in def) {
      if (!Object.hasOwnProperty.call(given, key) || given[key as string] === undefined) given[key as string] = def[key];
      else if (given[key as string] === Object(given[key as string])) given[key as string] = Util.merge(def[key], given[key as string]);
    }

    // @ts-ignore shut up
    return given;
  }

  /**
   * Finds a object's key from it's initial value
   * @param obj The object
   * @param key The key to find
   * @returns The value found or `null` if not specified
   */
  static getKey<T extends object, K extends keyof T>(obj: T, key: T[K]): K {
    return Object
      .keys(obj)
      .find(val => obj[val] === key) as unknown as K;
  }

  /**
   * Formats a message to a body that we can send
   * @param client The client for [MessageContent.mentions]
   * @param content The content to send
   * @param options Any additional options, if needed
   */
  static formatMessage(client: WebSocketClient, content: MessageContent, options?: MessageContentOptions) {
    const data: discord.RESTPostAPIChannelMessageJSONBody & { file?: MessageFile | MessageFile[] } = {};

    if (this.isObject(content) && (options !== undefined && Util.isObject(options)))
      throw new TypeError('Conflicting message contents, choose one or the other.');

    if (typeof content === 'string' && options === undefined) {
      data.content = content;
      return data;
    } else if (this.isObject(content) && options === undefined) {
      if (content.attachments !== undefined)
        data.file = content.attachments;

      if (content.mentions !== undefined)
        data.allowed_mentions = this.formatAllowedMentions(content.mentions, client);

      if (content.content !== undefined)
        data.content = content.content;

      if (content.embed !== undefined)
        data.embed = content.embed;

      if (content.reply !== undefined)
        data.message_reference = { message_id: content.reply };

      if (content.tts !== undefined)
        data.tts = Boolean(data.tts);
    } else if (typeof content === 'string' && (options !== undefined && this.isObject(options))) {
      data.content = content;

      if (options.attachments !== undefined)
        data.file = options.attachments;

      if (options.mentions !== undefined)
        data.allowed_mentions = this.formatAllowedMentions(options.mentions, client);

      if (options.embed !== undefined)
        data.embed = options.embed;

      if (options.reply !== undefined)
        data.message_reference = { message_id: options.reply };

      if (options.tts !== undefined)
        data.tts = Boolean(data.tts);
    } else if (options !== undefined && this.isObject(options)) {
      if (options.attachments !== undefined)
        data.file = options.attachments;

      if (options.mentions !== undefined)
        data.allowed_mentions = this.formatAllowedMentions(options.mentions, client);

      if (options.content !== undefined)
        data.content = options.content;

      if (options.embed !== undefined)
        data.embed = options.embed;

      if (options.reply !== undefined)
        data.message_reference = { message_id: options.reply };

      if (options.tts !== undefined)
        data.tts = Boolean(data.tts);
    } else {
      throw new SyntaxError('Missing message content, embed, or file');
    }

    return data;
  }

  static formatAllowedMentions(mentions: AllowedMentions, client: WebSocketClient): discord.APIAllowedMentionsSend {
    const data: discord.APIAllowedMentionsSend = {
      replied_user: mentions?.replied ?? client.options.allowedMentions.replied,
      parse: []
    };

    if (!mentions) {
      if (client.options.allowedMentions.everyone === true) data.parse!.push(discord.AllowedMentionsTypes.Everyone);
      if (client.options.allowedMentions.roles === true) data.parse!.push(discord.AllowedMentionsTypes.Role);
      if (client.options.allowedMentions.users === true) data.parse!.push(discord.AllowedMentionsTypes.User);

      if (Array.isArray(client.options.allowedMentions.roles)) data.roles = client.options.allowedMentions.roles;
      if (Array.isArray(client.options.allowedMentions.users)) data.users = client.options.allowedMentions.users;

      return data;
    }

    if (mentions.everyone === true) data.parse!.push(discord.AllowedMentionsTypes.Everyone);
    if (mentions.roles === true) data.parse!.push(discord.AllowedMentionsTypes.Role);
    if (mentions.users === true) data.parse!.push(discord.AllowedMentionsTypes.User);

    if (Array.isArray(mentions.roles)) data.roles = mentions.roles;
    if (Array.isArray(mentions.users)) data.users = mentions.users;

    return data;
  }

  static isReadableStream(stream: unknown): stream is Readable {
    return stream instanceof Readable && typeof stream.read === 'function';
  }

  static readableToBuffer(stream: Readable) {
    return new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = [];

      stream.on('error', reject);
      stream.on('data', buffer => buffers.push(buffer));
      stream.once('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  static isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  static hasNaclInstalled() {
    try {
      require('tweetnacl');

      return true;
    } catch(ex) {
      return false;
    }
  }

  static objectToQuery<T extends object = object>(obj: T) {
    let url = '';
    if (!Object.keys(obj).length) throw new TypeError('Missing key-value pairs in `obj`');

    const entries = Object.entries(obj);
    for (let i = 0; i < entries.length; i++) {
      const prefix = i === 0 ? '?' : '&';
      const [k, v] = entries[i];

      // Skip on undefined, null, or empty string values
      if (v === undefined || v === null || v === '') continue;

      url += `${prefix}${k}=${v}`;
    }

    return url;
  }

  static bufferToBase64(image: Buffer, type?: 'png' | 'jpg' | 'gif') {
    const base64 = image.toString('base64');
    return `data:image/${type ?? 'png'};base64,${base64}`;
  }
}
