const { join } = require('path');
const { HttpServer, middleware } = require('../build');

const server = new HttpServer({
  middleware: [middleware.logging(), middleware.headers()],
  purgeTimeout: 30000,
  routes: join(__dirname, 'endpoints'),
  port: 3621
});

server.on('error', console.error);
server.on('debug', console.debug);
server.on('request', (props) => console.log(`[${props.status} | ${props.method} ${props.path}] Request took ~${props.time}ms`));
server.on('listening', (networks) => console.log('listening on\n', networks.map(s => `~ ${s.type} ~ => ${s.host}`).join('\n')));

server.start();

process.on('SIGINT', () => {
  console.log('exit');
  server.close();

  process.exit(0);
});
