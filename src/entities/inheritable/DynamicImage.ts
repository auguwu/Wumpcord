/**
 * Copyright (c) 2020-2021 August
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

import type { ImageFormat, ImageSize } from '@wumpcord/rest';
import { ImageFormats } from '../../Constants';
import type { User } from '../User';

/**
 * Class for inherit CDN-related functions to entities, like `avatarUrl` and such
 */
export class DynamicImage {
  /**
   * Decorates a class with properties
   * @internal - This isn't exported in Wumpcord but highly unrecommended
   * @param klazz The class to inherit
   * @param props The props to add
   */
  static decorate(klazz: any, props: string[]) {
    const properties: string[] = [];

    if (props.includes('icon')) properties.push('dynamicIconUrl');
    else if (props.includes('avatar')) properties.push('dynamicAvatarUrl');
    else if (props.includes('banner')) properties.push('dynamicBannerUrl');
    else if (props.includes('splash')) properties.push('dynamicSplashUrl');

    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      Object.defineProperty(klazz.prototype, prop, Object.getOwnPropertyDescriptor(this.prototype, prop)!);
    }
  }

  /**
   * Dynamically formats a user's avatar
   * @param format The format to use (default `'png'`)
   * @param size The size to use (default `1024`)
   */
  dynamicAvatarUrl(this: any, format: ImageFormat = 'png', size: ImageSize = 1024) {
    if (this.avatar === null) {
      if (this instanceof (<{ User: typeof User }> require('../User')).User) {
        return `https://cdn.discordapp.com/embed/avatars/${this.discriminator}`;
      } else {
        return null;
      }
    }

    if (!ImageFormats.includes(format))
      throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.${format}?size=${size}`;
  }

  /**
   * Dynamically formats a guild splash screen
   * @param format The format to use (default `'png'`)
   * @param size The size to use (default `1024`)
   */
  dynamicSplashUrl(this: any, format: string = 'png', size: number = 1024) {
    if (this.splash === null) return null;
    if (!ImageFormats.includes(format)) throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return `https://cdn.discordapp.com/splashes/${this.id}/${this.splash}.${format}?size=${size}`;
  }

  /**
   * Dynamically formats a guild banner
   * @param format The format to use (default `'png'`)
   * @param size The size to use (default `1024`)
   */
  dynamicBannerUrl(this: any, format: string = 'png', size: number = 1024) {
    if (this.banner === null) return null;
    if (!ImageFormats.includes(format)) throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return `https://cdn.discordapp.com/banners/${this.id}/${this.banner}.${format}?size=${size}`;
  }

  /**
   * Dynamically formats a guild icon
   * @param format The format to use
   * @param size The size to use
   */
  dynamicIconUrl(this: any, format: string = 'png', size: number = 1024) {
    if (this.icon === null) return null;
    if (!ImageFormats.includes(format)) throw new TypeError(`Invalid format: ${format} (acceptable: ${ImageFormats.join(', ')})`);

    return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${format}?size=${size}`;
  }
}
