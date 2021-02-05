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

import Endpoint, { EndpointMeta } from '../Endpoint';

const ROUTE_SYMBOL = Symbol('$http::routes');
type RouteOptions = Omit<EndpointMeta, 'method' | 'path' | 'run'>;

/**
 * Returns any references from the [ROUTE_SYMBOL] available
 * @param target The target class
 */
export function getReferences(target: any): Endpoint[] {
  if (target.constructor === null) return [];

  const references = target.constructor[ROUTE_SYMBOL];
  if (!Array.isArray(references)) return [];

  return references;
}

/**
 * Represents a decorator to mark a method as a Function from a `Router` instance
 * @param path The path to use
 * @param options The options to use
 */
export default function Route(path: string, method: 'get' | 'post' | 'delete' | 'patch' | 'put', options?: RouteOptions) {
  return (target: any, property: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    if (target.prototype !== undefined)
      throw new SyntaxError(`Method '${target.name}#${String(property)}' was marked as a static class`);

    if (!target.constructor[ROUTE_SYMBOL])
      target.constructor[ROUTE_SYMBOL] = [];


    (target.constructor as Endpoint[]).push(new Endpoint({
      queryParams: options?.queryParams,
      parameters: options?.parameters,
      method,
      path,
      run: descriptor.value!
    }));
  };
}
