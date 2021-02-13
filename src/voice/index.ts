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
import VoiceConnection from './VoiceConnection';
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

  if (hasDjs) return require('@discordjs/opus');
  else if (hasOpus) return require('opusscript');
  else return null;
}

export function getConverter(connection: VoiceConnection, source: string | Stream): Promise<Converter | null> {
  if (typeof source === 'string' && existsSync(source)) {
    return new Promise((resolve) => {
      const stats = lstatSync(source);
      if (stats.isDirectory()) return null;

      const ext = extname(source);
      if (['.raw', '.pcm'].includes(ext)) {
        connection.debug('Using PCM converter');
        return resolve(new PCMConverter(connection, createReadStream(source)));
      }

      if (ext === '.dca') {
        connection.debug('Using Opus converter');
        return resolve(new OpusConverter(connection, createReadStream(source)));
      }

      if (ext === '.ogg') {
        connection.debug('Using OGG converter');
        return resolve(new OGGConverter(connection, createReadStream(source)));
      }
    });
  }

  if (source instanceof Stream) {
    let converter: Converter | null = null;
    return new Promise<Converter | null>((resolve) => {
      const onData = chunk => {
        if (chunk === null) return;

        try {
          connection.udp?.encoder.decode(chunk);
          converter = new OpusConverter(connection, source);

          connection.debug('Using Opus converter');
        } catch {
          converter = new FFMpegConverter(connection, source);
          connection.debug('Using FFMpeg converter');
        }

        resolve(converter);
        source.removeListener('data', onData);
      };

      source.on('data', onData);
    });
  }

  return Promise.resolve(null);
}

export {
  Converter,
  FFMpegConverter,
  OpusConverter,
  OGGConverter,
  PCMConverter,
  VoiceConnection
};

export { default as VoiceConnectionManager } from './VoiceConnectionManager';
export * as Constants from './Constants';
