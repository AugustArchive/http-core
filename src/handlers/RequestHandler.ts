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
import HttpServer from '../HttpServer';
import Endpoint from '../Endpoint';

interface Ratelimit {
  remaining: number;
  resetTime: Date;
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
  #server: HttpServer;

  /**
   * Creates a new [RequestHandler] instance
   * @param server The [HttpServer] to use
   */
  constructor(server: HttpServer) {
    // We use `.unref` to not keep the event loop awake to call RequestHandler#purge.
    this.#purgeInterval = setInterval(() => this.purge(), server.options.purgeTimeout ?? 30000).unref();
    this.#ratelimits = new Collection();
    this.#server = server;
  }

  private purge() {
    this.#server.emit('debug', `[RequestHandler] Cleaning up ${this.#ratelimits.size} records...`);

    for (const record of this.#ratelimits.keys()) this.#ratelimits.delete(record);
  }

  /**
   * Disposes this request handler, this is called with {@link https://docs.floofy.dev/http/classes#HttpServer-close #close} method.
   */
  dispose() {
    this.#server.emit('debug', '[RequestHandler] Disposed singleton');
    clearInterval(this.#purgeInterval);
  }

  /**
   * Handles a request from Express
   * @param req The request
   * @param res The response
   * @param route The route that was found from a specific {@link https://docs.floofy.dev/http/classes#class-Router Router}
   */
  handle(req: Request, res: Response, route: Endpoint) {
    this.#server.emit('debug', `[RequestHandler] Hit a request on ${req.method.toUpperCase()} ${req.url}`);

    // TODO: make this customizable?
    if (req.method.toLowerCase() !== route.method.toLowerCase())
      return res.status(405).json({
        message: `Method '${req.method.toLowerCase()}' on '${route.method.toLowerCase()} ${route.path}' is not allowed`
      });

    if (route.queryParams.length) {
      // todo
    }

    if (route.parameters.length) {
      // todo
    }

    if (req.ip !== '::1') {
      this.#server.emit('debug', `Applying ratelimits on "${req.method.toUpperCase()} ${req.url}" from ${req.ip}...`);

      const MAX = 1000; // todo: make this customizable

      const resetTime = new Date();
      resetTime.setMilliseconds(resetTime.getMilliseconds() + 3600000);

      const ratelimit = this.#ratelimits.get(req.ip) ?? {
        remaining: MAX,
        resetTime, // resets after an hour (make this customizable too)
        ip: req.ip
      };

      if (!res.headersSent) {
        // typescript can go suck my ass >w>
        res.header('X-RateLimit-Remaining', String(ratelimit.remaining));
        res.header('X-RateLimit-Limit', String(MAX));
        res.header('X-RateLimit-Reset', String(ratelimit.resetTime.getTime() / 1000));
      }

      let decremented = false;
      const decrementKey = () => {
        if (!decremented) {
          ratelimit.remaining--;
          decremented = true;
        }
      };

      res.on('finish', () => {
        if (res.statusCode >= 400 || res.statusCode < 400) decrementKey();
      });

      res.on('close', () => {
        if (!res.writableEnded) decrementKey();
      });

      if (ratelimit.remaining === MAX + 1) return res.status(429).json({
        message: 'Ratelimit has exceeded the amount of tries, try again in a hour'
      });

      if (ratelimit.remaining > MAX) {
        if (!res.headersSent)
          res.header('Retry-After', String(360000));

        return res.status(429).json({
          message: 'Ratelimit has exceeded, try again in a hour.'
        });
      }

      this.#ratelimits.set(req.ip, ratelimit);
    }

    return route.run(req, res);
  }
}
