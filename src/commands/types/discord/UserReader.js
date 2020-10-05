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

const ArgumentTypeReader = require('../../arguments/ArgumentTypeReader');
const Regex = /^(?:<@!?)?([0-9]+)>?$/;

/**
 * @extends {ArgumentTypeReader<import('../../../entities/User')>}
 */
module.exports = class MemberTypeReader extends ArgumentTypeReader {
  constructor(client) {
    super(client, 'user');
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} val The raw value
   * @param {import('../../arguments/Argument')} arg The argument
   * @returns {MaybePromise<boolean>}
   */
  async validate(ctx, val, arg) {
    // If we can't cache guild members
    if (!this.client.canCache('user')) return false;

    // Find it by regex (<@!{id}>)
    const matches = val.match(Regex);
    if (matches) {
      try {
        const member = await this.client.getUser(matches[1]);
        if (!member) return false;
        if (!arg.oneOf.includes(member.id)) return false;

        return true;
      } catch(ex) {
        return false;
      }
    }

    // Find it by nick/user#discrim (not exactly)
    const match1 = this.client.users.filter(user =>
      `${user.username.toLowerCase()}#${user.discriminator}`.includes(val.toLowerCase())
    );

    if (match1.length) return true;

    // Find it by nick/user#discrim (exactly)
    const match2 = this.client.users.filter(user =>
      `${user.username.toLowerCase()}#${user.discriminator}` === val.toLowerCase()
    );

    if (match2.length) return true;

    return false;
  }

  /**
   * @param {import('../../CommandContext')} ctx The command's context
   * @param {string} val The raw value
   * @param {import('../../arguments/Argument')} arg The argument
   * @returns {MaybePromise<import('../../../entities/User')>}
   */
  async parse(ctx, val, arg) {
    // If we can't cache users
    if (!this.client.canCache('user')) return false;

    // Find it by regex (<@!{id}>)
    const matches = val.match(Regex);
    if (matches) {
      try {
        const member = await this.client.getUser(matches[1]);
        if (!member) return null;
        if (!arg.oneOf.includes(member.id)) return null;

        return member;
      } catch(ex) {
        return null;
      }
    }

    // Find it by nick/user#discrim (not exactly)
    const match1 = this.client.users.filter(user =>
      `${user.username.toLowerCase()}#${user.discriminator}`.includes(val.toLowerCase())
    );

    if (match1.length) return match1[0];

    // Find it by nick/user#discrim (exactly)
    const match2 = this.client.users.filter(member =>
      `${user.username.toLowerCase()}#${user.discriminator}` === val.toLowerCase()
    );

    if (match2.length) return match2[0];

    return null;
  }
};

/**
 * @typedef {import('../../arguments/ArgumentTypeReader').MaybePromise<T>} MaybePromise
 * @template T
 */
