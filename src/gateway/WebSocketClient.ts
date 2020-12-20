/**
 * Copyright (c) 2020 August, Ice
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

import type { ClientOptions, NullableClientOptions } from '../types';
import * as Constants from '../Constants';
import { Collection } from '@augu/immutable';
import ShardManager from './ShardingManager';
import RestClient from '../rest/RestClient';
import EventBus from '../util/EventBus';
import Util from '../util';

//import type * as events from '../events';

interface WebSocketClientEvents {
  ready(): void;
}

/**
 * Handles everything related to Discord and is the entrypoint to your Discord bot.
 */
export default class WebSocketClient extends EventBus<WebSocketClientEvents> {
  /** List of voice connections available to the client */
  public voiceConnections: any;

  /** The interactions helper, this will return `null` if it's not enabled */
  public interactions: any;

  /** The channel cache available, this will be a empty Collection if not enabled. */
  public channels: any;

  /** The client options available to this WebSocket client. */
  public options: ClientOptions;

  /** The user typing cache if available, this will be a empty Collection if not enabled. */
  public typings: Collection<any>;

  /** The guild cache available, this will be a empty Collection if not enabled. */
  public guilds: any;

  /** The shard manager available to this context. */
  public shards: ShardManager;

  /** If we are ready to be used or not. */
  public ready: boolean = false;

  /** The client's token, this is hidden by default. */
  public token!: string;

  /** The user cache if available, this will be a empty Collection if not enabled. */
  public users: any;

  /** The rest client for creating requests to Discord's REST API. */
  public rest: RestClient;

  /** The self user instance */
  public user!: any;

  /**
   * Handles everything related to Discord and is the entrypoint to your Discord bot.
   * @param options The options available to this context
   */
  constructor(options: NullableClientOptions) {
    super();

    this.voiceConnections = null;
    this.interactions = null;
    this.channels = null;
    this.options = Util.merge(options, {});
    this.typings = new Collection();
    this.shards = new ShardManager(this);
    this.guilds = null;
    this.users = null;
    this.rest = new RestClient(this);
    this.user = null;

    Object.defineProperty(this, 'token', { value: options.token });
    this.once('ready', async () => {
      if (this.options.getAllUsers) {
        this.debug('Get All Users', 'Requesting all guild members...');
        await this.requestGuildMembers();
      }

      if (this.options.interactions) {
        this.debug('Interactions', 'Created interactions helper.');

        this.interactions = new InteractionHelper(this.user.id);
        await this.interactions.getGlobalCommands();
      }
    });
  }
}
