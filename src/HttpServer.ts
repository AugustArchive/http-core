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
  listening(networks: Network[]): void;
  request(props: RequestProperties): void;
  debug(message: string): void;
  error(error: Error): void;
}

interface RequestProperties {
  userAgent?: string;
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
  public routers: Collection<string, Router<this>>;
  public options: HttpServerOptions;
  public app: ReturnType<typeof express>;

  #server!: http.Server;

  constructor(options: HttpServerOptions = defaultConfig) {
    super();

    this.options = options;
    this.routers = new Collection();
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
    this.app.use(middleware.bind(this));
    return this;
  }

  router(router: Router<this>) {
    for (const endpoint of router.routes.values()) {
      this.app[endpoint.method](endpoint.path, async (req, res) => {
        if (req.method.toLowerCase() !== endpoint.method.toLowerCase())
          return res.status(405).json({
            message: `Method '${req.method.toLowerCase()}' on '${endpoint.method.toLowerCase()} ${endpoint.path}' is not allowed`
          });

        try {
          await endpoint.run.bind(this)(req, res);
        } catch(ex) {
          this.emit('error', ex);
          return res.status(500).json({
            message: 'Unexpected error has occured',
            error: `${ex.name}: ${ex.message}`
          });
        }
      });
    }

    for (const subrouter of router.subrouters.values()) {
      const endpoints = subrouter.routes.toArray();
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        this.app[endpoint.method](endpoint.path, async (req, res) => {
          if (req.method.toLowerCase() !== endpoint.method.toLowerCase())
            return res.status(405).json({
              message: `Method '${req.method.toLowerCase()}' on '${endpoint.method.toLowerCase()} ${endpoint.path}' is not allowed`
            });

          try {
            await endpoint.run.bind(this)(req, res);
          } catch(ex) {
            this.emit('error', ex);
            return res.status(500).json({
              message: 'Unexpected error has occured',
              error: `${ex.name}: ${ex.message}`
            });
          }
        });
      }
    }

    this.routers.set(router.prefix, router);
    this.emit('debug', `[Endpoints -> Router] Initialized router '${router.prefix}' with ${router.routes.size} routes.`);
  }
}
