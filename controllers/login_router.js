const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const expressRouter = require('express').Router;
const UserModel = require('../models/user_model');
const config = require('../utils/config');

const loginRouter = expressRouter();

loginRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body;
    const user = await UserModel.findOne({ username: body.username });
    const passwordCorrect = user === null ?
      false :
      await bcrypt.compare(body.password, user.passwordHash);

    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: 'invalid username or password',
      });
    }

    const userForToken = {
      username: user.username,
      id: user._id,
    };

    const token = jwt.sign(
      userForToken,
      config.SECRET,
      {
        expiresIn: config.TOKEN_EXPIRE_TIME,
      },
    );

    response
      .status(200)
      .send({
        token: token,
        username: user.username,
        displayName: user.displayName,
        id: user._id.toString(),
      });
  } catch (exception) {
    next(exception);
  }
});

module.exports = loginRouter;
