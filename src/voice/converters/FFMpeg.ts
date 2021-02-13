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

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import type VoiceConnection from '../VoiceConnection';
import type { Stream } from 'stream';
import Converter from '../Converter';

export default class FFmpegConverter extends Converter {
  private process: ChildProcessWithoutNullStreams | null;

  constructor(connection: VoiceConnection, source: Stream) {
    super(connection, source);

    this.process = spawn('ffmpeg', [
      '-reconnect',  '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      // @ts-ignore
      '-i', this.source,
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1'
    ]);

    this.process!.stdout.on('close', this.shutdown.bind(this));
    this.process!.stdout.on('data', buffer =>
      this.packets.push(connection.udp!.encoder.encode(buffer, (960 * 2) * 2))
    );

    this.process!.on('error', this.shutdown.bind(this));
  }

  provide() {
    return this.packets.shift();
  }

  shutdown(error?: Error) {
    this.debug(`Stream has ended ${error !== undefined ? `with error ${error.message}` : 'cleanly'}`);

    if (error !== undefined) this.connection.emit('error', error);

    this.process?.kill();
    this.process = null;
    this.ended = true;
  }
}
