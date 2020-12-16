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

const { Stream } = require('stream');
const { createReadStream, existsSync, lstatSync } = require('fs');
const { extname } = require('path');
const {
  FFMpeg,
  OGG,
  Opus,
  PCM
} = require('./');

module.exports = async function (con, source) {
  if (typeof source === 'string' && existsSync(source)) {
    const stats = lstatSync(source);
    if (stats.isDirectory()) return null;
    if (['.raw', '.pcm'].includes(extname(source))) return new PCM(con, createReadStream(source));
    if (extname(source) === '.dca') return new Opus(con, createReadStream(source));
    if (extname(source) === '.ogg') return new OGG(con, createReadStream(source));
    return null;
  }
  if (source instanceof Stream) {
    let converter = null;
    return new Promise(resolve => {
      const onData = chunk => {
        if (chunk === null) return;
        try {
          con.udp.encoder.decode(chunk, 960 * 2);
          converter = new Opus(con, source);
        } catch {
          converter = new FFMpeg(con, source);
        }
        resolve(converter);
        source.removeListener('data', onData);
      };
      source.on('data', onData);
    });
  }
  return new FFMpeg(con, source);
};

