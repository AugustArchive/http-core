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

import { Collection } from '@augu/collections';
import { headers } from './middleware';
import EventBus from './EventBus';
import express from 'express';
import Router from './Router';
import https from 'https';
import http from 'http';

type ExpressMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => void;

export interface HttpServerOptions {
  purgeTimeout?: number;
  middleware?: ExpressMiddleware[];
  routes?: string;
  host?: string;
  port?: number;
  ssl?: HttpSSLCertificates;
}

export interface Network {
  type: 'network' | 'local' | 'sock';
  host: string;
}

interface HttpServerEvents {
  [x: string]: any; // fuck you

  listening(networks: Network[]): void;
  error(error: Error): void;
}

export interface HttpSSLCertificates {
  cert: string;
  key: string;
  ca?: string;
}

function merge<T extends object>(given: T, def: T) {
  if (!given) return def;
  for (const key in def) {
    if (
      !Object.hasOwnProperty.call(given, key) ||
      given[key] === undefined
    ) given[key] = def[key];

    if (given[key] === Object(given[key]))
      given[key] = merge(def[key as string], given[key]);
  }

  return given;
}

/**
 * Represents a server to interact with the world!
 */
export default class HttpServer extends EventBus<HttpServerEvents> {
  public requests: any;
  public routers: Collection<string, Router>;
  public options: HttpServerOptions;

  constructor(options?: HttpServerOptions) {
    super();

    this.requests = null;
    this.routers = new Collection();
    this.options = merge<HttpServerOptions>(options!, {
      purgeTimeout: 30000,
      middleware: [headers()],
      port: 3621, // furries for the win! (im gonna get shit for this arent i, maybe?)
    });
  }
}
