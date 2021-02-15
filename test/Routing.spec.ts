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

import { Route, Router, getRouteReferences, HttpServer } from '../src';
import type { Request, Response } from 'express';
import supertest from 'supertest';

class DummyRouter extends Router {
  constructor() {
    super('/');
  }

  @Route('/', 'get')
  // @ts-ignore We do have decorators enabled...
  async main(req: Request, res: Response) {
    return res.status(200).send('Pong!');
  }
}

const dummyRouter = new Router('/uwu');
dummyRouter.get('/:userId', (req, res) => res.status(200).send('uwu!'));

const owo = new Router('/owo');
const subrouter = owo.route('/uwu');

subrouter.get('/', (_, res) => res.status(200).send({ ping: 0 }));

describe('Routing', () => {
  let router!: DummyRouter;
  let server!: HttpServer;

  beforeAll(async () => {
    router = new DummyRouter();
    server = new HttpServer();

    server.router(owo);
    await server.start();
  });

  afterAll(() => server.close());

  test('[decorators] should have 1 route from the target', () => {
    const references = getRouteReferences(router);

    expect(references.length).toBe(1);
  });

  test('[decorators] route 1 should have / as it\'s path', () => {
    const references = getRouteReferences(router);

    expect(references.length).toBe(1);
    expect(references[0].path).toBe('/');
  });

  test('[class-based] dummy router should be /uwu/:userId', () => {
    const route = dummyRouter.routes.get('get:/:userId')!;

    expect(route).not.toBeUndefined();
    expect(route.path).toBe('/uwu/:userId');
  });

  test('[subrouter] subrouter should contain 1 subrouter', () =>
    expect(owo.subrouters.size).toBe(1)
  );

  test('[subrouter] /owo should have /uwu as a subrouter defined as /owo/uwu', () => {
    expect(owo.subrouters.get('/owo/uwu')).not.toBeUndefined();
  });

  test('[subrouter] /owo should redirect to a 404', async () => {
    const res = await supertest(server.app).get('/owo');

    expect(res.status).toBe(404);
    expect(res.body).toStrictEqual({}); // what??
  });

  test('[subrouter] /owo/uwu should be a 200', async() => {
    const res = await supertest(server.app).get('/owo/uwu');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ping');
  });
});
