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

import { Router as ExpressRouter } from 'express';
import Endpoint, { EndpointMeta } from './Endpoint';
import { Collection } from '@augu/collections';

/** A router to extend routes from a specific prefix. Extension of `express.Router`. */
export default class Router {
  public ['constructor']!: typeof Router;

  /** Collection of sub-routers to implement */
  public subrouters: Collection<string, Router>;

  /** Collection of routes available in this ambient context */
  public routes: Collection<string, Endpoint>;

  /** The prefix of the router, this is used in [Router.convertPath] */
  public prefix: string;

  #server: any;
  #router: ExpressRouter;

  constructor(prefix: string) {
    this.subrouters = new Collection();
    this.#router = ExpressRouter();
    this.routes = new Collection();
    this.prefix = prefix;
  }

  init(server: any) {
    if (!this.#server)
      this.#server = server;

    return this;
  }

  get router() {
    return this.#router;
  }

  set router(r: ExpressRouter) {
    this.#router = r;
  }

  /**
   * Creates a subrouter of a specfic prefix
   * @param prefix The prefix to use
   * @returns a sub-router that is a [Router] instance
   */
  route(prefix: string) {
    const r = ExpressRouter();
    const router = new this.constructor(prefix);
    router.router = r;

    this.subrouters.set(this.convertPath(this.prefix, prefix), router);
    return router;
  }

  /**
   * Creates a endpoint using a `GET` request, 'body' from [meta] is omitted
   * @param path The path to use
   * @param meta The metadata or callback
   * @param callback A callback function if any specified metadata
   */
  get(path: string, meta: Omit<EndpointMeta, 'method' | 'run' | 'path' | 'body'>, callback: EndpointMeta['run']): this;

  /**
   * Creates a endpoint using a `GET` request
   * @param path The path to use
   * @param callback A callback function if any specified metadata
   */
  get(path: string, callback: EndpointMeta['run']): this;
  get(
    path: string,
    meta: Omit<EndpointMeta, 'method' | 'run' | 'path' | 'body'> | EndpointMeta['run'],
    callback?: EndpointMeta['run']
  ) {
    const runner = typeof meta !== 'object' ? meta : callback!;
    const queryParams = typeof meta === 'object' ? meta.queryParams : [];
    const parameters = typeof meta === 'object' ? meta.parameters : [];

    const endpoint = new Endpoint({
      queryParams,
      parameters,
      method: 'get',
      path,
      run: runner.bind(this.#server)
    });

    this.routes.set(`get:${path}`, endpoint);
    return this;
  }

  /**
   * Creates a endpoint using a `PUT` request
   * @param path The path to use
   * @param meta The metadata or callback
   * @param callback A callback function if any specified metadata
   */
  put(path: string, meta: Omit<EndpointMeta, 'method' | 'run' | 'path'>, callback: EndpointMeta['run']): this;

  /**
   * Creates a endpoint using a `PUT` request
   * @param path The path to use
   * @param callback A callback function if any specified metadata
   */
  put(path: string, callback: EndpointMeta['run']): this;
  put(
    path: string,
    meta: Omit<EndpointMeta, 'method' | 'run' | 'path'> | EndpointMeta['run'],
    callback?: EndpointMeta['run']
  ) {
    const runner = typeof meta !== 'object' ? meta : callback!;
    const queryParams = typeof meta === 'object' ? meta.queryParams : [];
    const parameters = typeof meta === 'object' ? meta.parameters : [];
    const body = typeof meta === 'object' ? meta.body : [];

    const endpoint = new Endpoint({
      queryParams,
      parameters,
      method: 'put',
      body,
      path,
      run: runner.bind(this.#server)
    });

    this.routes.set(`put:${path}`, endpoint);
    return this;
  }

  /**
   * Creates a endpoint using a `POST` request
   * @param path The path to use
   * @param meta The metadata or callback
   * @param callback A callback function if any specified metadata
   */
  post(path: string, meta: Omit<EndpointMeta, 'method' | 'run' | 'path'>, callback: EndpointMeta['run']): this;

  /**
   * Creates a endpoint using a `POST` request
   * @param path The path to use
   * @param callback A callback function if any specified metadata
   */
  post(path: string, callback: EndpointMeta['run']): this;
  post(
    path: string,
    meta: Omit<EndpointMeta, 'method' | 'run' | 'path'> | EndpointMeta['run'],
    callback?: EndpointMeta['run']
  ) {
    const runner = typeof meta !== 'object' ? meta : callback!;
    const queryParams = typeof meta === 'object' ? meta.queryParams : [];
    const parameters = typeof meta === 'object' ? meta.parameters : [];
    const body = typeof meta === 'object' ? meta.body : [];

    const endpoint = new Endpoint({
      queryParams,
      parameters,
      method: 'post',
      body,
      path,
      run: runner.bind(this.#server)
    });

    this.routes.set(`post:${path}`, endpoint);
    return this;
  }

  /**
   * Creates a endpoint using a `DELETE` request
   * @param path The path to use
   * @param meta The metadata or callback
   * @param callback A callback function if any specified metadata
   */
  delete(path: string, meta: Omit<EndpointMeta, 'method' | 'run' | 'path'>, callback: EndpointMeta['run']): this;

  /**
   * Creates a endpoint using a `DELETE` request
   * @param path The path to use
   * @param callback A callback function if any specified metadata
   */
  delete(path: string, callback: EndpointMeta['run']): this;
  delete(
    path: string,
    meta: Omit<EndpointMeta, 'method' | 'run' | 'path'> | EndpointMeta['run'],
    callback?: EndpointMeta['run']
  ) {
    const runner = typeof meta !== 'object' ? meta : callback!;
    const queryParams = typeof meta === 'object' ? meta.queryParams : [];
    const parameters = typeof meta === 'object' ? meta.parameters : [];
    const body = typeof meta === 'object' ? meta.body : [];

    const endpoint = new Endpoint({
      queryParams,
      parameters,
      method: 'delete',
      body,
      path,
      run: runner.bind(this.#server)
    });

    this.routes.set(`delete:${path}`, endpoint);
    return this;
  }

  /**
   * Creates a endpoint using a `PATCH` request
   * @param path The path to use
   * @param meta The metadata or callback
   * @param callback A callback function if any specified metadata
   */
  patch(path: string, meta: Omit<EndpointMeta, 'method' | 'run' | 'path'>, callback: EndpointMeta['run']): this;

  /**
   * Creates a endpoint using a `GET` request
   * @param path The path to use
   * @param callback A callback function if any specified metadata
   */
  patch(path: string, callback: EndpointMeta['run']): this;
  patch(
    path: string,
    meta: Omit<EndpointMeta, 'method' | 'run' | 'path'> | EndpointMeta['run'],
    callback?: EndpointMeta['run']
  ) {
    const runner = typeof meta !== 'object' ? meta : callback!;
    const queryParams = typeof meta === 'object' ? meta.queryParams : [];
    const parameters = typeof meta === 'object' ? meta.parameters : [];
    const body = typeof meta === 'object' ? meta.body : [];

    const endpoint = new Endpoint({
      queryParams,
      parameters,
      method: 'patch',
      body,
      path,
      run: runner.bind(this.#server)
    });

    this.routes.set(`patch:${path}`, endpoint);
    return this;
  }

  /**
   * Utility function to convert 2 prefixes into once
   * @param prefix The prefix to use
   * @param toMerge The prefix to merge
   */
  convertPath(prefix: string, toMerge: string) {
    if (toMerge === '/') return prefix;
    return `${prefix === '/' ? '' : prefix}${toMerge}`;
  }
}
