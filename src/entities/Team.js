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

const TeamMember = require('./misc/TeamMember');
const Base = require('./Base');

module.exports = class Team extends Base {
  /**
   * Creates a new [Team] instance
   * @param {import('../gateway/WebSocketClient')} client The client
   * @param {import('./Application').TeamPacket} data The data packet
   */
  constructor(client, data) {
    super(data.id);

    /**
     * The client
     * @private
     * @type {import('../gateway/WebSocketClient')}
     */
    this.client = client;

    this.patch(data);
  }

  /**
   * Patches this [Team] instance
   * @param {import('./Application').TeamPacket} data The data
   */
  patch(data) {
    /**
     * The icon UUID of the team
     * @type {?string}
     */
    this.icon = data.icon;

    /**
     * The name of the team
     * @type {?string}
     */
    this.name = data.name;

    /**
     * The owner of the team
     * @type {?import('./User')}
     */
    this.owner = this.client.canCache('user')
      ? this.client.users.get(data.owner_user_id)
      : null;

    /**
     * The members of the team
     * @type {TeamMember[]}
     */
    this.members = data.members.map(member => new TeamMember(this.client, member));
  }
};
