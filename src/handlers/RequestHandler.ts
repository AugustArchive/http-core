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

import type { Request, Response } from 'express';
import { Collection } from '@augu/collections';

interface Ratelimit {
  remaining: number;
  resetTime: number;
  ip: string;
}

/**
 * Handler for handling all requests from a endpoint listed in a {@link https://docs.floofy.dev/http/classes#class-HttpServer HttpServer}.
 *
 * This class handles ratelimiting, type-safe query / path parameters, request body payloads, etc. This
 * is the heart and soul of `@augu/http`. This is auto-injected when you construct a new [HttpServer] singleton.
 */
export default class RequestHandler {
  #purgeInterval: NodeJS.Timer;
  #ratelimits: Collection<string, Ratelimit>;
  #server: any;

  /**
   * Creates a new [RequestHandler] instance
   * @param server The [HttpServer] to use
   */
  constructor(server: any) {
    // We use `.unref` to not keep the event loop awake
    // to call RequestHandler#purge.
    this.#purgeInterval = setInterval(() => this.purge(), 30000).unref(); // todo: make this configurable
    this.#ratelimits = new Collection();
    this.#server = server;
  }

  private purge() {
    this.#server.log('RequestHandler', `Cleaning up ${this.#ratelimits.size} records...`);

    for (const record of this.#ratelimits.keys()) this.#ratelimits.delete(record);
  }

  /**
   * Disposes this request handler, this is called with {@link https://docs.floofy.dev/http/classes#HttpServer-close #close} method.
   */
  dispose() {
    this.#server.log('RequestHandler', 'Disposing this singleton');
    clearInterval(this.#purgeInterval);
  }

  /**
   * Handles a request from Express
   * @param req The request
   * @param res The response
   * @param route The route that was found from a specific {@link https://docs.floofy.dev/http/classes#class-Router Router}
   */
  handle(req: Request, res: Response, route: any) {
    // todo: stuff lol
  }
}
