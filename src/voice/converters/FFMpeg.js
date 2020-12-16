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

const Converter = require('./Converter');
const { Stream } = require('stream');
const { spawn } = require('child_process');

module.exports = class FFMpeg extends Converter {

  constructor(con, source) {
    super(con, source);
    this.child = spawn('ffmpeg', [
      '-reconnect',  '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-i', this.source,
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1'
    ]);
    this.child.stdout.on('data', (buffer) => this.packets.push(this.con.udp.encoder.encode(buffer, (960 * 2) * 2)));
    this.child.stdout.on('close', () => this.shutdown());
    this.child.on('error', err => this.shutdown(err));
  }

  provide() {
    return this.packets.shift();
  }

  shutdown(err) {
    console.log(err);
    this._debug(`Stream ended ${err ? `with error ${err.message}` : 'cleanly'}!`);
    this.child = null;
    this.ended = true;
  }

};
