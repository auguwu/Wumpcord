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

/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable camelcase */

/**
 * Namespace for all Discord-related objects that don't bleed into the `core` module
 */

import * as discord from 'discord-api-types/v8';
import { Tracing } from 'trace_events';
import * as core from '../core';

// Gateway-related content
export interface Gateway {
  url: string;
}

export interface BotGateway extends Gateway {
  session_start_limit: SessionStartLimit;
  shards: number;
}

export interface SessionStartLimit {
  reset_after: number;
  remaning: number;
  total: number;
}

type AnyChannel = TextChannel | DMChannel | GroupChannel | VoiceChannel | StoreChannel | NewsChannel;

// Extendable objects
interface Editable {
  edit(
    content: string | CreateMessageOptions | MessageFile | MessageFile[],
    options?: CreateMessageOptions | MessageFile | MessageFile[]
  ): Promise<Message>;
}

interface Textable {
  permissionsOf(memberID: string): core.Permissions;
  awaitMessages(filter: core.FilterFunction<Message>, time?: number): void;
  startTyping(count?: number): Promise<void>;
  getMessages(amount: number, options?: GetMessageOptions): Promise<Message[]>;
  stopTyping(force?: boolean): Promise<void>;
  bulkDelete(messageIDs: (string | Message)[]): Promise<string[]>;
  deletePin(message: Message): Promise<void>;
  getTyping(userID: string): core.UserTyping | null;
  getPins(): Promise<Message[]>;
  addPin(message: Message): Promise<void>;
  send(
    content: string | CreateMessageOptions | MessageFile[] | MessageFile,
    options?: CreateMessageOptions | MessageFile[] | MessageFile
  ): Promise<Message>;
}

interface CreateMessageOptions {
  allowedMentions?: core.AllowedMentions;
  content: string;
  embed?: discord.APIEmbed;
  file?: MessageFile;
  tts?: boolean;
}

interface MessageFile {
  name?: string;
  file: core.Multipart | Buffer;
}

// Discord API objects made for Wumpcord
export class Activity {
  constructor(data: discord.GatewayActivity);

  public timestamps: discord.GatewayActivity['timestamps'];
  public sessionID?: string;
  public createdAt: Date;
  public details: discord.GatewayActivity['details'];
  public syncID?: string;
  public emoji?: PartialEmoji;
  public state: discord.GatewayActivity['state'];
  public party: discord.GatewayActivity['party'];
  public type: string;
  public name: string;
  public rpc: boolean;
  public id: string;
}

export class Application extends Base {
  constructor(client: core.Client, data: discord.APIApplication);

  public get coverUrl(): string | null;
  public get iconUrl(): string | null;
  public rpcOrigins?: string[];
  public primarySKU?: string;
  public coverImage?: string;
  public description: string;
  public codeGrant: boolean;
  public guildID?: string;
  public summary: string;
  public guild?: Guild;
  public owner: User;
  public team?: Team;
  public slug?: string;
  public icon: string | null;
  public name: string;

  public dynamicCoverUrl(format?: core.ImageFormats, size?: number): string | null;
  public dynamicIconUrl(format?: core.ImageFormats, size?: number): string | null;
}

export class Attachment extends Base {
  constructor(data: discord.APIAttachment);

  public proxyUrl: string;
  public height: string;
  public width: string;
  public size: string;
  public url: string;
}

declare class Base {
  constructor(id: string);

  public createdAt: Date;
  public id: string;
}

export class BaseChannel extends Base {
  constructor(data: discord.APIChannel);

  public static from(client: core.Client, data: any): AnyChannel;
  public type: string;
}

export class BotUser extends User {
  public mfaEnabled: boolean;
  public verified: boolean;
}


