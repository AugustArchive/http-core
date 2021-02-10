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

import EndpointManager from './managers/EndpointManager';
import RequestHandler from './handlers/RequestHandler';
import { EventBus } from '@augu/utils';
import { headers } from './middleware';
import express from 'express';
import Router from './Router';
import https from 'https';
import http from 'http';
import os from 'os';

const { version } = require('../package.json');
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
  request(props: RequestProperties): void;
  debug(message: string): void;
  error(error: Error): void;
}

interface RequestProperties {
  status: string;
  method: string;
  path: string;
  time: number;
  url: string;
}

export interface HttpSSLCertificates {
  cert: string;
  key: string;
  ca?: string;
}

const defaultConfig: HttpServerOptions = {
  purgeTimeout: 30000,
  middleware: [headers()],
  port: 3621 // time to get shit on for being a furry hell yea!
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
 * Represents a server to interact with the world!
 */
export default class HttpServer extends EventBus<HttpServerEvents> {
  public endpoints: EndpointManager;
  public requests: RequestHandler;
  public options: HttpServerOptions;
  public app: ReturnType<typeof express>;

  #server!: http.Server;

  constructor(options: HttpServerOptions = defaultConfig) {
    super();

    if (options.routes === undefined)
      throw new SyntaxError('`options.routes` was undefined, set some routes!');

    this.options = options;
    this.endpoints = new EndpointManager(this, options.routes);
    this.requests = new RequestHandler(this);
    this.app = express();
  }

  private debug(title: string, message: string) {
    this.emit('debug', `[${title}] ${message}`);
  }

  async start() {
    this.debug('HttpServer', 'Initializing server...');
    this.debug('HttpServer', `Using v${version} of http-core | Report bugs -> https://github.com/auguwu/http-core/issues`);

    // Load in modules
    for (const mod of this.options.middleware ?? []) this.app.use(mod.bind(this));

    // Initialize routers
    await this.endpoints.load();

    // Initialize the server with SSL if implemented
    this.#server = this.options.ssl !== undefined ? https.createServer({
      cert: this.options.ssl.cert,
      key: this.options.ssl.key,
      ca: this.options.ssl.ca
    }, this.app) : http.createServer(this.app);

    // Add in listeners for http.Server
    this.#server.on('error', error => this.emit('error', error));
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
      const prefix = typeof address === 'string'
        ? 'unix:///'
        : this.options.ssl !== undefined
          ? 'https://'
          : 'http://';

      this.emit('listening', networks.map<Network>(network => ({
        type: network.type,
        host: network.type === 'sock' ? network.host : `${prefix}${network.host}:${this.options.port}`
      })));
    });

    // Start the server
    if (this.options.host !== undefined) {
      this.#server.listen(this.options.port, this.options.host);
    } else {
      this.#server.listen(this.options.port);
    }

    this.debug('HttpServer', 'Initialized successfully, maybe.');
  }

  close() {
    this.debug('HttpServer', 'Closing out, admiral.');
    this.#server.close();
  }

  use(middleware: ExpressMiddleware) {
    return this.app.use(middleware.bind(this));
  }

  addRouter(r: Router<this>) {
    this.endpoints.addRouter(r);
    return this;
  }
}
