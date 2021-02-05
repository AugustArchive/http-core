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

import { promises as fs } from 'fs';
import { NextHttpServer } from '../next';
import { getReferences } from '../decorators';
import type HttpServer from '../HttpServer';
import { Collection } from '@augu/collections';
import { join } from 'path';
import Router from '../Router';

interface Ctor<T> {
  new (...args: any[]): T;

  default?: Ctor<T> & { default: never };
}

function isNextHttp(x: unknown): x is NextHttpServer {
  return x instanceof NextHttpServer && typeof x.express !== 'undefined';
}

/**
 * Asynchronouslly read a directory recursively if any directories
 * are hit. [fs.readdir] does the job but doesn't recursively
 * add them in the array once fetched, it's just the directory name,
 * not the contents of that directory.
 *
 * @param path The path to get all files from
 */
async function readdir(path: string) {
  let results: string[] = [];
  const files = await fs.readdir(path);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const rawPath = join(path, file);
    const stats = await fs.lstat(file);

    if (stats.isDirectory()) {
      const items = await readdir(rawPath);
      results = results.concat(items);
    } else {
      results.push(rawPath);
    }
  }

  return results;
}

/** Represents a manager for handling routing */
export default class EndpointManager {
  public routers: Collection<string, Router>;

  #directory: string;
  #server: HttpServer | NextHttpServer;

  /**
   * Constructs a new [EndpointManager] instance
   * @param directory The directory
   */
  constructor(server: HttpServer | NextHttpServer, directory: string) {
    this.#directory = directory;
    this.routers = new Collection();
    this.#server = server;
  }

  private debug(title: string, message: string) {
    // @ts-ignore yea no thanks
    this.#server.emit('debug', `[${title}] ${message}`);
  }

  async load() {
    this.debug('EndpointManager', `Loading endpoints in '${this.#directory}'...`);

    // Check the statistics of the directory, doesn't de-reference symbolic links
    const stats = await fs.lstat(this.#directory);
    if (!stats.isDirectory()) {
      this.debug('EndpointManager', `Path ${this.#directory} was not a directory.`);
      return;
    }

    // Get a list of routers
    const files = await readdir(this.#directory);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ctor: Ctor<Router> = await import(file);
      const router = (ctor.default ? new ctor.default() : new ctor()).init(this.#server as any);

      const references = getReferences(router);
      for (let i = 0; i < references.length; i++) {
        const endpoint = references[i];
        const server = isNextHttp(this.#server) ? this.#server.express : this.#server.app;

        server[endpoint.method](endpoint.path, async (req, res) => {
          try {
            await this.#server.requests.handle(req, res, endpoint);
          } catch(ex) {
            // @ts-ignore it exists ok
            this.#server.emit('error', ex);
          }
        });
      }

      for (const endpoint of router.routes.values()) {
        const server = isNextHttp(this.#server) ? this.#server.express : this.#server.app;

        server[endpoint.method](endpoint.path, async (req, res) => {
          try {
            await this.#server.requests.handle(req, res, endpoint);
          } catch(ex) {
            // @ts-ignore it exists ok
            this.#server.emit('error', ex);
          }
        });
      }

      this.routers.set(router.prefix, router);
    }
  }
}
