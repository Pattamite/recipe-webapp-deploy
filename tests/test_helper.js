const jwt = require('jsonwebtoken');
const UserModel = require('../models/user_model');
const RecipeModel = require('../models/recipe_model');
const config = require('../utils/config');

const dummyUser = {
  username: 'dummy',
  displayName: 'Dummy',
  password: 'dummyPassword',
};

const initialRecipes = [
  {
    name: 'recipe 1',
    imagePath: 'recipe 1',
    shortDescription: 'recipe 1 ',
    description: 'recipe 1',
    difficulty: 1,
    estimatedMinutes: 1,
    ingredients: [
      {
        name: 'recipe 1 ingredient 1',
        quantity: 1,
        unit: 'recipe 1 ingredient 1 unit',
        imagePath: 'recipe 1 ingredient 1 imagePath',
      },
      {
        name: 'recipe 1 ingredient 2',
        quantity: 1,
        unit: 'recipe 1 ingredient 2 unit',
        imagePath: 'recipe 1 ingredient 2 imagePath',
      },
    ],
    steps: [
      {
        description: 'recipe 1 step 1 description',
        warning: 'recipe 1 step 1 warning',
        tip: 'recipe 1 step 1 tip',
        imagePath: 'recipe 1 step 1 imagePath',
      },
      {
        description: 'recipe 1 step 2 description',
        warning: 'recipe 1 step 2 warning',
        tip: 'recipe 1 step 2 tip',
        imagePath: 'recipe 1 step 2 imagePath',
      },
    ],
  },
  {
    name: 'recipe 2',
    imagePath: 'recipe 2',
    shortDescription: 'recipe 2 ',
    description: 'recipe 2',
    difficulty: 2,
    estimatedMinutes: 2,
    ingredients: [
      {
        name: 'recipe 2 ingredient 1',
        quantity: 2,
        unit: 'recipe 2 ingredient 1 unit',
        imagePath: 'recipe 2 ingredient 1 imagePath',
      },
      {
        name: 'recipe 2 ingredient 2',
        quantity: 2,
        unit: 'recipe 2 ingredient 2 unit',
        imagePath: 'recipe 2 ingredient 2 imagePath',
      },
    ],
    steps: [
      {
        description: 'recipe 2 step 1 description',
        warning: 'recipe 2 step 1 warning',
        tip: 'recipe 2 step 1 tip',
        imagePath: 'recipe 2 step 1 imagePath',
      },
      {
        description: 'recipe 2 step 2 description',
        warning: 'recipe 2 step 2 warning',
        tip: 'recipe 2 step 2 tip',
        imagePath: 'recipe 2 step 2 imagePath',
      },
    ],
  },
  {
    name: 'recipe 3',
    imagePath: 'recipe 3',
    shortDescription: 'recipe 3 ',
    description: 'recipe 3',
    difficulty: 3,
    estimatedMinutes: 3,
    ingredients: [
      {
        name: 'recipe 3 ingredient 1',
        quantity: 3,
        unit: 'recipe 3 ingredient 1 unit',
        imagePath: 'recipe 3 ingredient 1 imagePath',
      },
      {
        name: 'recipe 3 ingredient 2',
        quantity: 3,
        unit: 'recipe 3 ingredient 2 unit',
        imagePath: 'recipe 3 ingredient 2 imagePath',
      },
    ],
    steps: [
      {
        description: 'recipe 3 step 1 description',
        warning: 'recipe 3 step 1 warning',
        tip: 'recipe 3 step 1 tip',
        imagePath: 'recipe 3 step 1 imagePath',
      },
      {
        description: 'recipe 3 step 2 description',
        warning: 'recipe 3 step 2 warning',
        tip: 'recipe 3 step 2 tip',
        imagePath: 'recipe 3 step 2 imagePath',
      },
    ],
  },
];

const newRecipe = {
  name: 'recipe 1',
  imagePath: 'recipe 1',
  shortDescription: 'recipe 1 ',
  description: 'recipe 1',
  difficulty: 1,
  estimatedMinutes: 1,
  ingredients: [
    {
      name: 'recipe 1 ingredient 1',
      quantity: 1,
      unit: 'recipe 1 ingredient 1 unit',
      imagePath: 'recipe 1 ingredient 1 imagePath',
    },
    {
      name: 'recipe 1 ingredient 2',
      quantity: 1,
      unit: 'recipe 1 ingredient 2 unit',
      imagePath: 'recipe 1 ingredient 2 imagePath',
    },
  ],
  steps: [
    {
      description: 'recipe 1 step 1 description',
      warning: 'recipe 1 step 1 warning',
      tip: 'recipe 1 step 1 tip',
      imagePath: 'recipe 1 step 1 imagePath',
    },
    {
      description: 'recipe 1 step 2 description',
      warning: 'recipe 1 step 2 warning',
      tip: 'recipe 1 step 2 tip',
      imagePath: 'recipe 1 step 2 imagePath',
    },
  ],
};

/** Get every user in database */
async function getUsersInDb() {
  const users = await UserModel.find({});
  return users.map((user) => {
    return user.toJSON();
  });
}

/** Get every recipe in database */
async function getRecipesInDb() {
  const recipes = await RecipeModel.find({});
  return recipes.map((recipe) => {
    return recipe.toJSON();
  });
}

/** Generate login token from user
 * @param {Object} user - user object from UserModel
 * @return {Object} login token
*/
async function generateLoginTokenFromUser(user) {
  const userForToken = {
    username: user.username,
    id: user.id,
  };

  return jwt.sign(
    userForToken,
    config.SECRET,
  );
}

/** Generate non existing id
 * @return {String} non existing id
*/
async function generateNonExistingId() {
  const fakeDummyUser = {
    username: 'fakeDummy',
    displayName: 'Dummy',
    passwordHash: 'dummyPassword',
  };

  const fakeUser = new UserModel(fakeDummyUser);
  await fakeUser.save();
  await fakeUser.remove();

  return fakeUser._id.toString();
}

const testHelper = {
  dummyUser,
  initialRecipes,
  newRecipe,
  getUsersInDb,
  getRecipesInDb,
  generateLoginTokenFromUser,
  generateNonExistingId,
};

module.exports = testHelper;
