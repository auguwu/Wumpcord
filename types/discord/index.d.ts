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

// Extendable objects
interface DynamicImage {
  dynamicAvatarUrl?(format?: core.ImageFormats, size?: number): string | null;
  dynamicSplashUrl?(format?: core.ImageFormats, size?: number): string | null;
  dynamicBannerUrl?(format?: core.ImageFormats, size?: number): string | null;
  dynamicIconUrl?(format?: core.ImageFormats, size?: number): string | null;
}

interface Editable {
  edit?(
    content: string | CreateMessageOptions | MessageFile | MessageFile[],
    options?: CreateMessageOptions | MessageFile | MessageFile[]
  ): Promise<Message>;
}

interface Textable {
  createMessageCollector?(): core.MessageCollector;
  permissionsOf?(memberID: string): core.Permissions;
  awaitMessages?(filter: core.FilterFunction<Message>, time?: number): void;
  startTyping?(count?: number): Promise<void>;
  getMessages?(amount: number, options?: GetMessageOptions): Promise<Message[]>;
  stopTyping?(force?: boolean): Promise<void>;
  bulkDelete?(messageIDs: (string | Message)[]): Promise<string[]>;
  deletePin?(message: Message): Promise<void>;
  getTyping?(userID: string): core.UserTyping | null;
  getPins?(): Promise<Message[]>;
  addPin?(message: Message): Promise<void>;
  send?(
    content: string | CreateMessageOptions | MessageFile[] | MessageFile,
    options?: CreateMessageOptions | MessageFile[] | MessageFile
  ): Promise<Message>;
}
