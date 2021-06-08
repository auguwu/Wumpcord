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

import type { GatewayReadyDispatchData } from 'discord-api-types';
import type { Shard } from '../Shard';
import { SelfUser } from '../../entities';

/**
 * Type-alias for a shard event processor function
 */
export type ShardEventProcessor<S> = (shard: Shard, data: S) => void | Promise<void>;

/** @internal */
export const READY: ShardEventProcessor<GatewayReadyDispatchData> = (shard, data) => {
  if (!shard.client.user)
    shard.client.user = new SelfUser(shard.client, data.user);

  shard.debug(`Received READY packet! Hello ${shard.client.user.tag} <3`);

  shard.unavailableGuilds = new Set(data.guilds.map(r => r.id));
  shard.sessionID = data.session_id;
  shard.status = 'WaitingForGuilds';

  shard.client.users.put(shard.client.user);
};

/** @internal */
export const RESUME: ShardEventProcessor<{ s: number }> = (shard, { s }) => {
  shard.debug(`Session has resumed and replayed ${(s - shard.seq).toLocaleString()} events`);

  const replayed = s - shard.seq;
  shard.emit('resume', replayed);
};

export * from './interaction';
export * from './presence';
export * from './invites';
export * from './message';
export * from './channel';
export * from './guild';
export * from './voice';
