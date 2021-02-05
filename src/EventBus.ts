/**
 * Copyright (c) 2021 August
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

/* eslint-disable @typescript-eslint/ban-types */

// Credit: https://github.com/cyyynthia/hazeljs/blob/mistress/src/emitter.ts
import EventEmitter from 'events';

interface DefaultEventEmitterMap {
  [x: string]: (...args: any[]) => void;
}

interface EventBus<E extends DefaultEventEmitterMap = DefaultEventEmitterMap> extends EventEmitter {
  emit: <Event extends Extract<keyof E, string>>(event: Event, ...args: Parameters<E[Event]>) => boolean;

  on: <Event extends Extract<keyof E, string>>(event: Event, callback: E[Event]) => this;
  once: <Event extends Extract<keyof E, string>>(event: Event, callback: E[Event]) => this;
  addListener: <Event extends Extract<keyof E, string>>(event: Event, callback: E[Event]) => this;
  prependListener: <Event extends Extract<keyof E, string>>(event: Event, callback: E[Event]) => this;
  prependOnceListener: <Event extends Extract<keyof E, string>>(event: Event, callback: E[Event]) => this;

  off: <Event extends Extract<keyof E, string>>(event: Event, callback: E[Event]) => this;
  removeListener: <Event extends Extract<keyof E, string>>(event: Event, callback: E[Event]) => this;
  removeAllListeners: (event: Extract<keyof E, string>) => this;

  listeners: (event: Extract<keyof E, string>) => Function[];
  rawListeners: (event: Extract<keyof E, string>) => Function[];
  listenerCount: (event: Extract<keyof E, string>) => number;
}

class EventBus<E extends DefaultEventEmitterMap = DefaultEventEmitterMap> extends EventEmitter {}

export default EventBus;
