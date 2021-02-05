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

import type { Network, HttpServerOptions, HttpSSLCertificates } from '../HttpServer';
import type { NextConfig } from 'next/dist/next-server/server/config';
import RequestHandler from '../handlers/RequestHandler';
import { resolve } from 'path';
import { headers } from '../middleware';
import type Next from 'next/types';
import EventBus from '../EventBus';
import express from 'express';
import https from 'https';
import http from 'http';
import os from 'os';

const { version } = require('../../package.json');

let next: typeof Next | undefined;
try {
  require('next');
} catch {
  // ignore
}

interface NextHttpServerOptions extends HttpServerOptions {
  /** The path to your Next.js configuration or a object containing your {@link https://nextjs.org/docs/api-reference/next.config.js/introduction configuration} details */
  config?: string | object;

  /** If Next and the http server should slient out errors */
  quiet?: boolean;

  /** Location to your Next.js project, default is the root directory the application is being bootstrapped in */
  dir?: string;

  /** If Next should be in development mode, default is `true` */
  dev?: boolean;
}

interface NextHttpServerEvents {
  [x: string]: (...args: any[]) => void;

  listening(port: number, networks: Network[]): void;
  debug(message: string): void;
  error(error: Error): void;
}

const defaultConfig: NextHttpServerOptions = {
  purgeTimeout: 30000,
  middleware: [headers()],
  config: resolve(process.cwd(), '..', 'next.config.js'),
  quiet: false,
  port: 3621, // im gonna get shit on for this lol
  dev: (process.env.NODE_ENV ?? 'development') === 'development'
};

function findAvailableHost() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const { address, family, internal } of interfaces[name]!) {
      if (family === 'IPv4' && !internal) return address;
    }
  }

  return null;
}

/**
 * Http server similar to [module:http/HttpServer] with Next.js support
 *
 * Handles ratelimiting, not found/http status code events, etc.
 */
export default class NextHttpServer extends EventBus {
  /** The request handler for working with Express and Next.js */
  public requests: RequestHandler;

  /** The options provided by the user */
  public options: NextHttpServerOptions;

  /** The Express application */
  public express!: ReturnType<typeof express>;

  /** The Next.js application that was bootstrapped, this is filled in when [NextHttpServer#start] has been called */
  public app!: ReturnType<typeof Next>;

  #server!: http.Server;
  #ssl?: HttpSSLCertificates;

  /**
   * Creates a new [NextHttpServer] instance
   * @param options The options to use
   */
  constructor(options: NextHttpServerOptions = defaultConfig) {
    super();

    if (next === undefined)
      throw new SyntaxError('Missing `next` package! Install it using `npm i next` and run this again.');

    if (options.routes === undefined)
      throw new SyntaxError('`options.routes` was undefined, set a path to load routes in!');

    this.requests = new RequestHandler(this);
    this.options = options;
    this.#ssl = options.ssl;
  }

  private debug(title: string, message: string) {
    this.emit('debug', `[${title}] ${message}`);
  }

  private _onError(error: Error) {
    this.emit('error', error);
  }

  private bootstrap() {
    // Initialize an Express application
    this.express = express();

    // Populate all modules
    for (const mod of this.options.middleware ?? []) this.express.use(mod);

    // Create a http server with SSL if needed
    this.#server = this.options.ssl !== undefined ? https.createServer({
      cert: this.options.ssl.cert,
      key: this.options.ssl.key,
      ca: this.options.ssl.ca
    }, this.express) : http.createServer(this.express);

    // Add in listeners for http.Server
    this.#server.on('error', this._onError.bind(this));
    this.#server.on('listening', () => {
      const address = this.#server.address();
      const networks: Network[] = [];

      if (typeof address === 'string') {
        networks.push({ type: 'sock', host: address });
      } else if (address !== null) {
        if (address.address === '::')
          networks.push({ type: 'local', host: 'localhost' });

        networks.push({ type: 'network', host: address.address });
      }

      networks.push({ type: 'network', host: findAvailableHost()! });
      const prefix = this.#ssl !== undefined ? 'https' : 'http';

      this.emit('listening', networks.map<Network>(network => ({
        type: network.type,
        host: network.type === 'sock' ? network.host : `${prefix}://${network.host}:${this.options.port}`
      })));
    });
  }

  async start() {
    this.debug('NextHttpServer', 'Initializing server...');
    this.debug('NextHttpServer', `Using v${version} of @augu/http, report any bugs at https://github.com/auguwu/http-core/issues`);

    // Initialize Next
    const config = this.options.config !== undefined && typeof this.options.config === 'string'
      ? require(this.options.config) as NextConfig
      : this.options.config as NextConfig | undefined;

    this.app = next!({
      quiet: this.options.quiet !== undefined && this.options.quiet === true,
      conf: config,
      dir: this.options.dir,
      dev: this.options.dev ?? true
    });

    // Wait until the application is prepared
    const handler = this.app.getRequestHandler();
    await this.app.prepare();

    // Bootstrap the server
    this.bootstrap();

    // Create a wildcard handler for Next
    this.express.all('*', (req, res) => handler(req, res));

    // Start the server
    if (this.options.host !== undefined) {
      this.#server.listen(this.options.port, this.options.host);
    } else {
      this.#server.listen(this.options.port);
    }
  }

  close() {
    this.debug('NextHttpServer', 'Closing out, admiral.');
    this.#server.close();
  }
}
