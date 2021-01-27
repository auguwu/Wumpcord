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

import type { WebSocketClientEvents } from '../../gateway/WebSocketClient';

const SYMBOL = Symbol('wumpcord.lol'); // wumpcord.list_of_listeners
const EVENT_SYMBOL = Symbol('wumpcord.listener');
const IS_LISTENER_SYMBOL = Symbol('wumpcord.$$listener$$');

export interface EventDefinition {
  event: keyof WebSocketClientEvents;
  run: EventCaller<keyof WebSocketClientEvents>;
}

/**
 * Returns a list of event listeners from the parent [target]'s constructor
 * @param target target class
 */
export function getEventDefinitions(target: any): EventDefinition[] {
  if (target.constructor === null) return [];

  const definitions = target.constructor[SYMBOL];
  if (!definitions.length) return [];

  return definitions;
}

/**
 * Checks if the parent [target] is a [Listener] instance
 * @param target target class
 */
export const isListener = (target: any) =>
  target.constructor[EVENT_SYMBOL] !== undefined && target.constructor[EVENT_SYMBOL] === IS_LISTENER_SYMBOL;

type EventCaller<K extends keyof WebSocketClientEvents>
  = (...args: Parameters<WebSocketClientEvents[K]>) => void | Promise<void>;

/**
 * Decorator to listen events from a function of a class
 * @param event The event to listen to
 * @returns A [MethodDecorator] to call for events
 */
export function Event<K extends keyof WebSocketClientEvents>(event: K) {
  return (
    target: any,
    prop: string | symbol,
    descriptor: TypedPropertyDescriptor<EventCaller<K>>
  ) => {
    if (target.prototype !== undefined)
      throw new TypeError(`Prototype of ${target.name ?? '<anonymous>'}#${String(prop)} is not defined`);

    if (!target.constructor[EVENT_SYMBOL] || target.constructor[EVENT_SYMBOL] !== IS_LISTENER_SYMBOL)
      throw new TypeError(`Class ${target.name ?? '<anoymous>'}#${String(prop)} was not marked as a Listener.`);

    if (!target.constructor[SYMBOL]) target.constructor[SYMBOL] = [];

    (target.constructor[SYMBOL] as EventDefinition[]).push({
      event,
      run: descriptor.value!
    });
  };
}

/**
 * Mark a class as a [Listener], to receive events from
 */
export function Listener(): ClassDecorator {
  return (target: any) => {
    if (target.constructor[EVENT_SYMBOL] !== undefined)
      throw new Error(`Class "${target.name}" is already marked as a [Listener].`);

    target.constructor[EVENT_SYMBOL] = IS_LISTENER_SYMBOL;
  };
}
