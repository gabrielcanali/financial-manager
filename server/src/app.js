const express = require('express');
const { routes } = require('./routes');
const { errorHandler } = require('./http/error-handler');

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(routes);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
