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

/**
 * Represents a member in a team of an OAuth2 application
 */
module.exports = class TeamMember {
  /**
   * Creates a new [TeamMember] instance
   * @param {import('../../gateway/WebSocketClient')} client The client
   * @param {import('../Application').TeamMemberPacket} data The data supplied
   */
  constructor(client, data) {
    /**
     * The client
     * @private
     * @type {import('../../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches this [TeamMember] instance
   * @param {import('../Application').TeamMemberPacket} data The data supplied
   */
  patch(data) {
    /**
     * The user instance of the member
     * @type {import('../User')}
     */
    this.user = this.client.canCache('user')
      ? this.client.users.get(data.user.id) || new (require('../User'))(this.client, data.user)
      : null;

    /**
     * The membership state
     * @type {number}
     */
    this.membership = data.membership_state;

    /**
     * The permissions of the team member
     * @type {string[]}
     */
    this.permissions = data.permissions;
  }
};
