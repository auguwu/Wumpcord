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

/**
 * Represents an emittion class for emitting events from different structural classes
 */
module.exports = class EventBus {
  constructor() {
    /**
     * Represents all of the listeners avaliable
     * @type {{ [x: string]?: Listener[] }}
     */
    this.listeners = {};
  }

  /**
   * Emits a new event
   * @param {string} event The event
   * @param  {...any} args The arguments supplied
   */
  emit(event, ...args) {
    if (!(event in this.listeners)) return false;

    const listeners = this.listeners[event];
    for (const listen of listeners) listen(...args);

    return true;
  }

  /**
   * Pushes a listener to the callstack
   * @param {string} event The event
   * @param {Listener} listener The listener
   */
  on(event, listener) {
    if (this.listeners.hasOwnProperty(event)) {
      this.listeners[event].push(listener);
    } else {
      this.listeners[event] = [listener];
    }

    return this;
  }

  /**
   * Pushes an event to the callstack then removes it when it's emitted
   * @param {string} event The event
   * @param {Listener} listener The listener
   */
  once(event, listener) {
    const listen = (...args) => {
      listener(...args);
      this.remove(event, listen);
    };

    return this.on(event, listen);
  }

  /**
   * Removes an event from the callstack
   * @param {string} event The event
   * @param {Listener} listener The listener
   */
  remove(event, listener) {
    if (!this.listeners.hasOwnProperty(event)) return false;

    const listeners = this.listeners[event];
    if (!listeners.length) return false;

    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);

    if (!listeners.length) delete this.listeners[event];
    else this.listeners[event] = listeners;

    return true;
  }

  /**
   * Returns the size of the events
   * @param {string} [event] The event
   */
  size(event) {
    if (event) {
      return this.listeners.hasOwnProperty(event) ? this.listeners[event].length : 0;
    } else {
      return Object.keys(this.listeners).length;
    }
  }
};

/**
 * @typedef {((...args: any[]) => void)} Listener
 */