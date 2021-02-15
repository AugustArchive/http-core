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

import { Collection } from '@augu/collections';
import { EventBus } from '@augu/utils';
import * as express from 'express';

declare namespace http {
  /** Returns the version of `@augu/http` */
  export const version: string;

  /** Metadata referring to a {@link https://docs.floofy.dev/http/classes#class-Endpoint Endpoint}. */
  interface EndpointMeta {
    queryParams?: EndpointRequirement[];
    parameters?: EndpointRequirement[];
    method: 'get' | 'post' | 'patch' | 'put' | 'delete';
    path: string;
    run: EndpointRunner;
  }

  interface EndpointRequirement {
    required: boolean;
    name: string;
  }

  type EndpointRunner<S = http.HttpServer> = (this: S, req: Request, res: Response) => any | Promise<any>;
  type ExpressMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => void;

  export interface HttpServerOptions {
    purgeTimeout?: number;
    middleware?: ExpressMiddleware[];
    host?: string;
    port?: number;
    ssl?: HttpSSLCertificates;
  }

  export interface Network {
    type: 'network' | 'local' | 'sock';
    host: string;
  }

  interface RequestProps {
    status: string;
    method: string;
    path: string;
    time: number;
    url: string;
  }

  interface HttpServerEvents {
    listening(networks: Network[]): void;
    request(props: RequestProps): void;
    debug(message: string): void;
    error(error: Error): void;
  }

  export interface HttpSSLCertificates {
    cert: string;
    key: string;
    ca?: string;
  }

  /**
   * Represents a decorator to mark a method as a Function from a `Router` instance
   * @param path The path to use
   * @param method The method to use
   * @param options The options to use
   */
  export function Route(
    path: string,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    options?: Omit<EndpointMeta, 'method' | 'run' | 'path'>
  ): MethodDecorator;

  /**
   * Returns any references from the [ROUTE_SYMBOL] available
   * @param target The target class
   */
  export function getRouteReferences(target: any): http.Endpoint[];

  /**
   * A router class to extend routes to from a specfic prefix. This can be used
   * with the `@Route` decorator or an Express-similar approach.
   *
   * This is also an extension to `express.Router`
   */
  export class Router<S extends http.HttpServer = http.HttpServer> {
    constructor(prefix: string);

    /** List of sub-routers chained to this [Router] */
    public subrouters: Collection<string, Router<S>>;

    /** List of routes available of this [Router]'s context */
    public routes: Collection<string, http.Endpoint>;

    /** The prefix to use */
    public prefix: string;

    /** Returns the available [express.Router] instance for this [Router] */
    public get router(): express.Router;

    /** Sets the [express.Router] instance for this [Router] */
    public set router(r: express.Router);

    /**
     * Defines an new subrouter of a specific prefix
     * @param prefix The prefix to use
     * @returns A new [Router] instance
     */
    public route(prefix: string): Router<S>;

    /**
     * Creates a endpoint using a `GET` request
     * @param path The path to use
     * @param meta The metadata used
     * @param callback A callback function if any specified metadata
     */
    public get(
      path: string,
      meta: Omit<http.EndpointMeta, 'method' | 'run' | 'path'>,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `GET` request
     * @param path The path to use
     * @param callback A callback function if any specified metadata
     */
    public get(
      path: string,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `PUT` request
     * @param path The path to use
     * @param meta The metadata used
     * @param callback A callback function if any specified metadata
     */
    public put(
      path: string,
      meta: Omit<http.EndpointMeta, 'method' | 'run' | 'path'>,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `PUT` request
     * @param path The path to use
     * @param callback A callback function if any specified metadata
     */
    public put(
      path: string,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `POST` request
     * @param path The path to use
     * @param meta The metadata used
     * @param callback A callback function if any specified metadata
     */
    public post(
      path: string,
      meta: Omit<http.EndpointMeta, 'method' | 'run' | 'path'>,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `POST` request
     * @param path The path to use
     * @param callback A callback function if any specified metadata
     */
    public post(
      path: string,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `PATCH` request
     * @param path The path to use
     * @param meta The metadata used
     * @param callback A callback function if any specified metadata
     */
    public patch(
      path: string,
      meta: Omit<http.EndpointMeta, 'method' | 'run' | 'path'>,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `PATCH` request
     * @param path The path to use
     * @param callback A callback function if any specified metadata
     */
    public patch(
      path: string,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `DELETE` request
     * @param path The path to use
     * @param meta The metadata used
     * @param callback A callback function if any specified metadata
     */
    public delete(
      path: string,
      meta: Omit<http.EndpointMeta, 'method' | 'run' | 'path'>,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Creates a endpoint using a `DELETE` request
     * @param path The path to use
     * @param callback A callback function if any specified metadata
     */
    public delete(
      path: string,
      callback: http.EndpointRunner<S>
    ): Router<S>;

    /**
     * Utility function to convert prefixes from one and another
     * @param prefix The prefix to use
     * @param toMerge The prefix to merge with
     */
    public convertPath(prefix: string, toMerge: string): string;
  }

  /** Represents a endpoint from a {@link https://docs.floofy.dev/http/classes#class-Router Router} instance */
  class Endpoint {
    public queryParams: EndpointRequirement[];
    public parameters: EndpointRequirement[];
    public method: 'get' | 'post' | 'patch' | 'put' | 'delete';
    public path: string;
    public run: EndpointRunner;

    constructor(meta: EndpointMeta);
  }

  export class HttpServer extends EventBus<http.HttpServerEvents> {
    constructor(options?: http.HttpServerOptions);

    public options: http.HttpServerOptions;
    public app: ReturnType<typeof express>;

    public router(router: http.Router<this>): this;
    public start(): Promise<void>;
    public close(): void;
    public use(middleware: ExpressMiddleware): this;
  }
}

export = http;
export as namespace http;
