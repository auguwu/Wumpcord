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

import type VoiceConnection from './VoiceConnection';
import type { Stream } from 'stream';

export default abstract class Converter {
  public connection: VoiceConnection;
  public packets: Buffer[];
  public source: Stream;
  public ended: boolean;

  constructor(connection: VoiceConnection, source: Stream) {
    this.connection = connection;
    this.packets = [];
    this.source = source;
    this.ended = false;
  }

  abstract shutdown(error?: Error): void;
  abstract provide(): Buffer | undefined;

  debug(message: string) {
    const name = (this.constructor as typeof Converter).name;
    this.connection.debug(message, `${name}/${this.connection.guildID}/${this.connection.channelID}`);
  }
}
