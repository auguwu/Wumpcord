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

import type { CacheType, NonNulledClientOptions } from '../../Client';
import { EventType, MAX_GUILDS_TO_CLUSTER } from '../../util/Constants';
import type * as models from '../../util/models';
import type { Event } from './types';
import { Collection } from '@augu/immutable';
import { ClientUser } from '../../structures';

export const READY: Event<models.ReadyEvent> = function (data) {
  this.client.user = new ClientUser(this.client, data.d.user);
  this.sessionID = data.d.session_id;

  if ((<any> data).t === EventType.Resumed) {
    this.ackHeartbeat();
    this.client.emit('resume');

    return;
  }

  // Populate the cache for guilds, channels, and users
  // TODO?: maybe refractor this?
  if (this.client.options.cache === 'none') {
    this.client.channels = 0;
    this.client.guilds   = data.d.guilds.length;
    this.client.users    = 1;
  } else if (this.client.options.cache === 'all') {
    this.client.channels = new Collection();
    this.client.guilds   = new Collection();
    this.client.users    = new Collection();
  } else {
    this.client.channels = this.client.canCache('channel') ? new Collection() : 0;
    this.client.guilds   = this.client.canCache('guild')   ? new Collection() : data.d.guilds.length;
    this.client.users    = this.client.canCache('user')    ? new Collection() : 0;
  }

  if (data.d.guilds.length) {
    if (data.d.guilds.length >= MAX_GUILDS_TO_CLUSTER) this.client.emit('warn', `You have reached the max amount of guilds to be required to cluster! (~${MAX_GUILDS_TO_CLUSTER} guilds)`);
    this.guilds = new Set(data.d.guilds.map(s => s.id));
  }

  if (this.client.users instanceof Collection) this.client.users.set(this.client.user.id, this.client.user);

  this.client.emit('ready');
};