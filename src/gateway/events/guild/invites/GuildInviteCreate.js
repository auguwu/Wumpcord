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

const GuildInvite = require('../../../../entities/GuildInvite');

/**
 * Function to call when a invite has created in a guild
 * @type {import('../..').EventCallee}
 */
const onInviteCreate = function ({ d: data }) {
  if (!this.client.canCache('channel') || !this.client.canCache('invite')) {
    this.debug('Unable to emit inviteCreate: Channel and invite cache is not enabled');
    return;
  }

  /** @type {import('../../../../entities/channel/TextChannel')} */
  const channel = this.client.channels.get(data.channel_id) || { id: data.channel_id };
  if (channel.hasOwnProperty('type')) {
    if (channel.type !== 'text') {
      this.debug(`Unable to emit inviteCreate: Channel "${channel.id}" was not a text channel`);
      return;
    }
  }

  const invite = new GuildInvite(this.client, data);
  channel.invites.set(invite.code, invite);

  this.client.emit('inviteCreate', channel, invite);
};

module.exports = onInviteCreate;
