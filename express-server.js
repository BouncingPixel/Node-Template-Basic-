const DefaultExpress = require('@bouncingpixel/default-express');
const app = DefaultExpress.app;

const routes = require('./server/routes');
for (let r in routes) {
  app.use(r, routes[r]);
}

DefaultExpress.start(app);
