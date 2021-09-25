const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const config = require('../utils/config');
const UserModel = require('../models/user_model');

const api = supertest(app);

describe('When there is initially one user in db', () => {
  const dummyUsername = helper.dummyUser.username;
  const dummyDisplayName = helper.dummyUser.displayName;
  const dummyPassword = helper.dummyUser.password;
  let dummyPasswordHash = null;

  let isHashedPassword = false;

  beforeEach(async () => {
    await UserModel.deleteMany({});
    if (!isHashedPassword) {
      dummyPasswordHash =
        await bcrypt.hash(dummyPassword, config.SALT_ROUND);
      isHashedPassword = true;
    }

    const user = new UserModel({
      username: dummyUsername,
      displayName: dummyDisplayName,
      passwordHash: dummyPasswordHash,
    });

    await user.save();
  });

  test('login succeeds with a correct username and password', async () => {
    const loginInfo = {
      username: dummyUsername,
      password: dummyPassword,
    };

    const response = await api
      .post('/api/login')
      .send(loginInfo)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const token = response.body;
    expect(token.username).toEqual(dummyUsername);
  });

  test('login fails with an incorrect password', async () => {
    const loginInfo = {
      username: dummyUsername,
      password: dummyPassword + 'lmaoxd',
    };

    await api
      .post('/api/login')
      .send(loginInfo)
      .expect(401);
  });

  test('login fails with an incorrect username', async () => {
    const loginInfo = {
      username: dummyUsername + 'lmaoxd',
      password: dummyPassword,
    };

    await api
      .post('/api/login')
      .send(loginInfo)
      .expect(401);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
