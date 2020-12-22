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

/**
 * Represents a listener
 */
export type Listener = (...args: any[]) => void;

/**
 * Represents a default type for the event bus
 */
interface DefaultEventBusMap {
  [x: string]: Listener;
}

/**
 * Represents an emittion class for emitting events from different structural classes
 */
export default class EventBus<T extends object = DefaultEventBusMap> {
  /** Amount of max listeners to implement */
  private maxListeners: number = 250;

  /** The actual listener map */
  private listeners: T = {} as any;

  /**
   * Emits a event from the callstack
   * @param event The event to emit
   * @param args Any additional arguments to add-onto the listener
   * @returns A boolean value if it was emitted or not
   */
  emit<K extends keyof T>(event: K, ...args: any[]) {
    if (!(event in this.listeners)) return false;

    const listeners = this.listeners[event as string];
    if (!listeners.length) return false;

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener(...args);
    }

    return true;
  }

  /**
   * Pushes a new event to the callstack
   * @param event The event
   * @param listener The listener
   */
  on<K extends keyof T>(event: K, listener: T[K]) {
    const listeners = this.listeners[event as string] || [];
    if (listeners.length > this.maxListeners) throw new TypeError(`Reached max event listeners in event '${event}' (${listeners.length})`);

    listeners.push(listener);

    this.listeners[event as string] = listeners;
    return this;
  }

  /**
   * Pushes a event to the callstack and removes it when it's emitted
   * @param event The event
   * @param listener The listener
   */
  once<K extends keyof T>(event: K, listener: T[K]) {
    // @ts-ignore I know what I'm doing (no I don't)
    const onceListener: any = (...args: any[]) => {
      (listener as any)(...args);
      this.remove(event, onceListener);
    };

    return this.on(event, onceListener);
  }

  /**
   * Removes a event from the callstack
   * @param event The event to remove
   * @param listener The listener to remove
   */
  remove<K extends keyof T>(event: K, listener: T[K]) {
    if (!this.listeners.hasOwnProperty(event)) return false;

    const listeners = this.listeners[event as string];
    if (!listeners.length) return false;

    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);

    this.listeners[event as string] = listeners;
    return true;
  }

  /**
   * Returns the size of a specific event
   * @param event The event
   */
  size<K extends keyof T>(event: K): number;

  /**
   * Returns the size of all the events available
   */
  size(): number;

  /**
   * Returns the size of all events available or a specific event
   * @param event The event
   */
  size<K extends keyof T>(event?: K) {
    if (event) {
      return this.listeners[event as string] ? this.listeners[event as string].length : 0;
    } else {
      return Object.keys(this.listeners).length;
    }
  }

  /**
   * Sets the maximum amount of listeners to add
   * @param count The amount to set
   */
  setMaxListeners(count: number) {
    this.maxListeners = count;
    return this;
  }

  /**
   * Removes all of the listeners in this [EventBus]
   */
  removeAllListeners() {
    this.listeners = {} as any;
    return this;
  }
}
