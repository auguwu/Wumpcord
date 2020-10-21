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

const { Endpoints, ImageFormats } = require('../../Constants');

/**
 * Class to inherit dynamic-able image handler(s)
 */
module.exports = class DynamicImage {
  /**
   * Decorates a class with the properties
   * inside [DynamicImage].
   *
   * @param {any} klazz The class to inherit properties
   * @param {Array<'icon' | 'avatar' | 'banner' | 'splash'>} props The properties to get
   */
  static decorate(klazz, props = ['avatar']) {
    const properties = [];

    if (props.includes('icon')) properties.push('dynamicIconUrl');
    else if (props.includes('avatar')) properties.push('dynamicAvatarUrl');
    else if (props.includes('banner')) properties.push('dynamicBannerUrl');
    else if (props.includes('splash')) properties.push('dynamicSplashUrl');

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      Object.defineProperty(klazz.prototype, property, Object.getOwnPropertyDescriptor(this.prototype, property));
    }
  }

  /**
   * Dynamically formats an avatar URl
   * @param {'png' | 'jpg' | 'gif' | 'jpeg' | 'webp'} [format='png'] The format to use
   * @param {number} [size=1024] The size to use
   * @returns {string | null} Returns the avatar or the user's default avatar URL
   */
  dynamicAvatarUrl(format = 'png', size = 1024) {
    if (!this.avatar) {
      if (this instanceof require('../user')) {
        return Endpoints.CDN.getDefaultAvatar(this.discriminator);
      } else {
        return null;
      }
    }

    if (!ImageFormats.includes(format)) throw new TypeError(`Invalid format '${format}'`);
    return Endpoints.CDN.getUserAvatar(this.id, this.avatar, format, size);
  }

  /**
   * Dynamically formats an splash URl
   * @param {'png' | 'jpg' | 'gif' | 'jpeg' | 'webp'} [format='png'] The format to use
   * @param {number} [size=1024] The size to use
   * @returns {string | null} Returns the avatar or the user's default avatar URL
   */
  dynamicSplashUrl(format = 'png', size = 1024) {
    if (!this.splash) return null;
    if (!ImageFormats.includes(format)) throw new TypeError(`Invalid format '${format}'`);

    return Endpoints.CDN.getGuildSplash(this.id, this.avatar, format, size);
  }

  /**
   * Dynamically formats an guild banner URl
   * @param {'png' | 'jpg' | 'gif' | 'jpeg' | 'webp'} [format='png'] The format to use
   * @param {number} [size=1024] The size to use
   * @returns {string | null} Returns the avatar or the user's default avatar URL
   */
  dynamicBannerUrl(format = 'png', size = 1024) {
    if (!this.banner) return null;
    if (!ImageFormats.includes(format)) throw new TypeError(`Invalid format '${format}'`);

    return Endpoints.CDN.getGuildBanner(this.id, this.avatar, format, size);
  }

  /**
   * Dynamically formats a guild icon URL
   * @param {'png' | 'jpg' | 'gif' | 'jpeg' | 'webp'} [format='png'] The format to use
   * @param {number} [size=1024] The size to use
   * @returns {string | null} Returns the avatar or the user's default avatar URL
   */
  dynamicIconUrl(format = 'png', size = 1024) {
    if (!this.icon) return null;
    if (!ImageFormats.includes(format)) throw new TypeError(`Invalid format '${format}'`);

    return Endpoints.CDN.getGuildIcon(this.id, this.icon, format, size);
  }
};
