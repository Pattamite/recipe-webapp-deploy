const bcrypt = require('bcrypt');
const expressRouter = require('express').Router;
const UserModel = require('../models/user_model');
const config = require('../utils/config');
const helper = require('./router_helper');

const usersRouter = expressRouter();

usersRouter.get('/', async (request, response, next) => {
  try {
    const pageNumber = request.query.page ? request.query.page : 1;
    const paginationObject = await helper.getPaginationFromModel(
      model = UserModel,
      page = pageNumber,
    );
    response.json(paginationObject);
  } catch (exception) {
    next(exception);
  }
});

usersRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body;

    const passwordHash =
      await bcrypt.hash(body.password, config.SALT_ROUND);

    const user = new UserModel({
      username: body.username,
      displayName: body.displayName,
      passwordHash: passwordHash,
    });

    const savedUser = await user.save();

    response.json(savedUser.toJSON());
  } catch (exception) {
    next(exception);
  }
});

usersRouter.get('/id/:id', async (request, response, next) => {
  try {
    const user = await UserModel.findById(request.params.id);
    if (user) {
      response.json(user);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

usersRouter.get('/user/:username', async (request, response, next) => {
  try {
    const user = await UserModel.findOne({ username: request.params.username });
    if (user) {
      response.json(user);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

module.exports = usersRouter;
