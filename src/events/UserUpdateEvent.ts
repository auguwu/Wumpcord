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

import type { GatewayUserUpdateDispatchData } from 'discord-api-types';
import type { PartialEntity } from '../types';
import { User } from '../models';
import Event from './Event';

interface UserUpdateReferences {
  user: PartialEntity<User>;
  old?: PartialEntity<User>;
}

export class UserUpdateEvent extends Event<GatewayUserUpdateDispatchData, UserUpdateReferences> {
  get old() {
    return this.$refs.old;
  }

  get user() {
    return this.$refs.user;
  }

  process() {
    const user = this.client.users.get(this.data.id);
    if (!user) {
      this.shard.debug('Unable to emit \'userUpdate\': Missing cached user, emitting anyway');
      this.$refs = { old: undefined, user: new User(this.client, this.data) };

      return;
    }

    const updated = this.client.users.add(new User(this.client, this.data));
    this.$refs = {
      old: user,
      user: updated
    };
  }
}
