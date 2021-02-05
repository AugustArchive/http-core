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

/** Metadata referring to a {@link https://docs.floofy.dev/http/classes#class-Endpoint Endpoint}. */
export interface EndpointMeta {
  queryParams?: EndpointRequirement[];
  parameters?: EndpointRequirement[];
  method: 'get' | 'post' | 'patch' | 'put' | 'delete';
  path: string;
  run: EndpointRunFunction;
}

interface EndpointRequirement {
  required: boolean;
  name: string;
}

type EndpointRunFunction = (this: any, req: Request, res: Response) => void | Promise<void>;
export type IEndpointRunFunc = (req: Request, res: Response) => void | Promise<void>;

/** Represents a endpoint from a {@link https://docs.floofy.dev/http/classes#class-Router Router} instance */
export default class Endpoint {
  public queryParams: EndpointRequirement[];
  public parameters: EndpointRequirement[];
  public method: 'get' | 'post' | 'patch' | 'put' | 'delete';
  public path: string;
  public run: EndpointRunFunction;

  constructor(meta: EndpointMeta) {
    this.queryParams = meta.queryParams ?? [];
    this.parameters = meta.parameters ?? [];
    this.method = meta.method;
    this.path = meta.path;
    this.run = meta.run;
  }
}
