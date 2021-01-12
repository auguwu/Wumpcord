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

import { createReadStream, existsSync, lstatSync } from 'fs';
import { extname } from 'path';
import { Stream } from 'stream';
import Util from '../util';

import FFMpegConverter from './converters/FFMpeg';
import OpusConverter from './converters/Opus';
import PCMConverter from './converters/PCM';
import OGGConverter from './converters/Ogg';

import Converter from './Converter';

/** The opus libraries available */
export type OpusLibrary = typeof import('opusscript') | typeof import('@discordjs/opus');

/**
 * Returns the opus library to use, returns `null` if no
 * encoder is installed
 */
export function getOpus(): OpusLibrary | null {
  const hasDjs = Util.tryRequire('@discordjs/opus');
  const hasOpus = Util.tryRequire('opusscript');

  if (hasOpus) return require('opusscript');
  else if (hasDjs) return require('@discordjs/opus');
  else return null;
}

export function getConverter(connection: any, source: string | Stream): Converter | null | Promise<Converter | null> {
  if (typeof source === 'string' && existsSync(source)) {
    const stats = lstatSync(source);
    if (stats.isDirectory()) return null;

    const ext = extname(source);
    if (['.raw', '.pcm'].includes(ext)) return new PCMConverter(connection, createReadStream(source));
    if (ext === '.dca') return new OpusConverter(connection, createReadStream(source));
    if (ext === '.ogg') return new OGGConverter(connection, createReadStream(source));

    return null;
  }

  if (source instanceof Stream) {
    let converter: Converter | null = null;
    return new Promise<Converter | null>((resolve) => {
      const onData = chunk => {
        if (chunk === null) return;

        try {
          connection.udp?.encoder.decode(chunk, 960 * 2);
          converter = new OpusConverter(connection, source);
        } catch {
          converter = new FFMpegConverter(connection, source);
        }

        resolve(converter);
        source.removeListener('data', onData);
      };

      source.on('data', onData);
    });
  }

  return null;
}

export {
  Converter,
  FFMpegConverter,
  OpusConverter,
  OGGConverter,
  PCMConverter
};

export { default as VoiceConnectionManager } from './VoiceConnectionManager';
export { default as VoiceConnection } from './VoiceConnection';
export * as Constants from './Constants';
