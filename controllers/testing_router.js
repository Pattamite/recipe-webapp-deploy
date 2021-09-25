// eslint-disable-next-line new-cap
const expressRouter = require('express').Router;
const UserModel = require('../models/user_model');

const testingRouter = expressRouter();

testingRouter.post('/reset', async (request, response) => {
  await UserModel.deleteMany({});

  response.status(204).end();
});

module.exports = testingRouter;
