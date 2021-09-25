const config = require('./utils/config');
const express = require('express');
const cors = require('cors');
const usersRouter = require('./controllers/users_router');
const loginRouter = require('./controllers/login_router');
const recipesRouter = require('./controllers/recipes_router');
const middleware = require('./utils/middleware');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const app = express();

logger.info('connecting to', config.MONGODB_URI);
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message);
  });

app.use(cors());
app.use(express.static('build'));
app.use(express.json());
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);
app.use(middleware.userIdExtractor);
app.use('/api/login', loginRouter);
app.use('/api/users', usersRouter);
app.use('/api/recipes', recipesRouter);

if (config.NODE_ENV === 'test') {
  const testingRounter = require('./controllers/testing_router');
  app.use('/api/testing', testingRounter);
}

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
