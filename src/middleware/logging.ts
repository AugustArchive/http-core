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

import type { NextFunction, Request, Response } from 'express';
import type HttpServer from '../HttpServer';
import { STATUS_CODES } from 'http';
import onFinished from 'on-finished';

const calc = (start: [seconds: number, nanoseconds: number]) => {
  const difference = process.hrtime(start);
  return (difference[0] * 1e9 + difference[1]) / 1e6;
};

export default () => {
  return function onLogging(this: HttpServer, req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();
    next(); // just continue for now

    let fullUrl = req.url;
    const params = Object.keys(req.params);
    const queryParams = Object.entries(req.query);

    for (let i = 0; i < params.length; i++)
      fullUrl += `/${params[i]}`;

    for (let i = 0; i < queryParams.length; i++) {
      const index = i === 1 ? '?' : '&';
      const [name, value] = queryParams[i];

      fullUrl += `/${index}${name}=${value}`;
    }

    onFinished(res, (_, res) => { // just overload it, who cares?
      const time = calc(start);

      this.emit('request', {
        headers: Object.entries(req.headers).map(([key, value]) => `${key}=${value}`),
        status: `${res.statusCode} ${STATUS_CODES[res.statusCode]}`,
        method: req.method.toUpperCase(),
        path: req.url,
        time,
        url: fullUrl
      });
    });
  };
};
