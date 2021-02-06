import { Route, Router } from '../../../build';

export default class SomeRoute extends Router {
  constructor() {
    super('/');
  }

  @Route('/', 'get')
  async main(req, res) {
    return res.status(200).send('hellO!');
  }
}
