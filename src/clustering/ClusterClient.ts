/**
 * Copyright (c) 2020-2021 August, Ice
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

import { NullableClientOptions } from '../types';
import { Collection } from '@augu/collections';
import WebSocketClient from '../gateway/WebSocketClient';
import IPCRouter from './IPCRouter';
import Cluster from './Cluster';
import Module from './Module';
import { cpus } from 'os';
import MessagingIPCRouter from './ipc/Messaging';

interface ClusterClientOptions extends NullableClientOptions {
  /** Timeout to reject a IPC message */
  ipcMessageTimeout?: number;

  /** Timeout to reject a fetch query */
  fetchTimeout?: number;

  /** List of clusters to run, this defaults to the number of CPU cores the machine is running in but will denonate if it's too huge based on shard count */
  clusterCount?: number | 'auto';

  /** Timeout to reject a evaluation query. */
  evalTimeout?: number;

  /** IPC router to use */
  ipcRouter?: IPCRouter;

  /** List of node arguments to run to boot up a worker */
  nodeArgs?: string[];

  /** List of modules to inject, use [ClusterClient#inject] to inject a module */
  modules?: Module[];

  /** Absolute path to execute a script to run the bot */
  path: string;
}

/**
 * Entrypoint of creating a bot using the `cluster` module.
 */
export default class ClusterClient extends WebSocketClient {
  public clusterCount: number;
  public clusters: Collection<string, Cluster>;
  public options!: Omit<Required<ClusterClientOptions>, 'clusterCount'>;
  public modules: Collection<string, Module>;
  public ipc: IPCRouter;

  constructor(options: ClusterClientOptions) {
    super(options);

    this.clusterCount = options.clusterCount === 'auto' ? cpus().length : options.clusterCount ?? cpus().length;
    this.clusters = new Collection();
    this.modules = new Collection();
    this.ipc = options.ipcRouter ?? new MessagingIPCRouter();
  }

  async start() {
    // todo: this
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  eval(script: string | Function, ...args: any[]) {
    // todo: this
  }

  queue<Data extends object = object>(op: number, d?: Data) {
    // todo: this
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  evalIn(workerID: number, data: string | Function, ...args: any[]) {
    // todo: this
  }

  restart(id: number) {
    // todo: this
  }

  inject(module: Module) {
    // todo: this
  }

  uninject(module: string | Module) {
    // todo: this
  }

  disconnect(reconnect: boolean = false) {
    // todo: this
    return super.disconnect(reconnect);
  }
}
