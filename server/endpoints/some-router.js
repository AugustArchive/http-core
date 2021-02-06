const { Router } = require('../../build');
const router = new Router();

router.get('/', (req, res) => res.status(200).send('Pong!'));

module.exports = router;
