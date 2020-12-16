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
let ogg;
try {
  ogg = require('ogg');
} catch {
  ogg = new Error('Unable to use an OGG decoder, package not installed!');
}

module.exports = class OGG extends Converter {

  constructor(con, source) {
    super(con, source);
    const decoder = new ogg.Decoder();
    source.pipe(decoder);
    decoder.on('stream', stream => {
      stream.on('data', chunk => {
        console.log('received ogg packet: '+chunk);
      });
      source.on('close', () => this.shutdown());
    });
  }

  provide() {
    return this.packets.shift();
  }

  shutdown() {
    this.ended = true;
  }

};
