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

import { Queue } from '@augu/collections';

/** Represents a packet to send */
interface QueueMessage<D extends object = object> {
  resolve(value: any): void;
  reject(error?: any): void;

  op: number;
  d?: D;
  t: number;
}

/**
 * Represents an attachable router instance to extend IPC messaging capatibilities.
 *
 * @example
 * ```js
 * import { IPCRouter } from 'wumpcord/clustering';
 *
 * export default class SomeIPCRouter extends IPCRouter {
 *   constructor() {
 *     super('router-name');
 *   }
 *
 *   deliver(op, data) {
 *     // do whatever to send data, must return a Promise
 *   }
 * }
 * ```
 */
export default abstract class IPCRouter {
  public ['constructor']!: typeof IPCRouter;

  /** Packet queue */
  public packets: Queue<QueueMessage>;

  /** The name of the IPC router */
  public name: string;

  /**
   * Creates a new instance of a [IPCRouter]
   * @param name The name of the IPC router
   */
  constructor(name: string) {
    this.packets = new Queue();
    this.name = name;
  }

  /**
   * Delivers a packet to the IPC service accordingly. This
   * must be overrided and the data __**should be**__ serialized to JSON using
   * `JSON.stringify`.
   *
   * @param packet The packet to send
   */
  abstract deliver(packet: string): void | Promise<void>;

  /**
   * Function to "start" the router, this is used if we need
   * to connect to a external service
   */
  start(): void | Promise<void> {
    throw new SyntaxError('Overridable function `start` was not provided');
  }

  /**
   * Function to call to pass in data from 1 service to another to return a object
   * of the result provided when it receives a message or a [Error] on why it didn't
   * queue successfully.
   *
   * @template Data JSON-serializable packet to send
   * @param op The OPCode to use
   * @param data Any JSON-serializable data to send, read on [passing in data](#) for more
   * information.
   *
   * @returns A Promise that is queued until a message has been received.
   */
  send<Data extends object = object>(op: number, data?: Data) {
    return new Promise((resolve, reject) => {
      this.packets.push({ op, d: data, t: Date.now(), resolve, reject });
      return this.deliver(JSON.stringify({ op, d: data, t: Date.now() }));
    });
  }

  /**
   * Eval a specific script in the master process
   * @param script The script to use
   */
  eval(script: string | ((this: any, ...args: any[]) => void)) {
    return this.send(3, {
      worker: 'master',
      script: typeof script === 'function' ? script.toString() : script
    });
  }

  /**
   * Eval a specific script on a worker's process
   * @param workerID The worker's ID
   * @param script The script to use
   */
  evalIn(workerID: number, script: string | ((this: any, ...args: any[]) => void)) {
    return this.send(3, {
      worker: workerID,
      script: typeof script === 'function' ? script.toString() : script
    });
  }
}
