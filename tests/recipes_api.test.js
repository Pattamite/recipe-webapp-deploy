const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const config = require('../utils/config');
const UserModel = require('../models/user_model');
const RecipeModel = require('../models/recipe_model');

const api = supertest(app);

describe('When there is initially some recipes and 2 users in db', () => {
  const dummyUsername = helper.dummyUser.username;
  const dummyDisplayName = helper.dummyUser.displayName;
  const dummyPassword = helper.dummyUser.password;
  let dummyPasswordHash = null;

  const newUsername = 'testUserNameForTestingUserApi';
  const newDisplayName = 'TestUserDisplayNameForTestingUserApi';
  const newPassword = 'testPasswordForTestingUserApi';
  let newPasswordHash = null;

  let user1Token = null;
  let user2Token = null;
  let user1Id = null;
  const authenType = { type: 'bearer' };

  let isHashedPassword = false;

  beforeEach(async () => {
    await UserModel.deleteMany({});
    if (!isHashedPassword) {
      dummyPasswordHash =
        await bcrypt.hash(dummyPassword, config.SALT_ROUND);
      newPasswordHash =
        await bcrypt.hash(newPassword, config.SALT_ROUND);
      isHashedPassword = true;
    }

    const user1 = new UserModel({
      username: dummyUsername,
      displayName: dummyDisplayName,
      passwordHash: dummyPasswordHash,
    });
    const savedUser1 = await user1.save();
    user1Id = savedUser1.id;
    user1Token = await helper.generateLoginTokenFromUser(savedUser1);

    const user2 = new UserModel({
      username: newUsername,
      displayName: newDisplayName,
      passwordHash: newPasswordHash,
    });
    const savedUser2 = await user2.save();
    user2Id = savedUser2.id;
    user2Token = await helper.generateLoginTokenFromUser(savedUser2);

    await RecipeModel.deleteMany({});
    for (const recipe of helper.initialRecipes) {
      const newRecipe = new RecipeModel({
        ...recipe,
        user: savedUser1._id,
        date: new Date(),
      });
      await newRecipe.save();
    }
  });

  describe('querying pagination', () => {
    describe('using default pagination setting', () => {
      const expectedPaginationSection = {
        page: 1,
        pageNext: null,
        pagePrev: null,
        pageTotal: 1,
        resultsCount: helper.initialRecipes.length,
        resultsPerpage: 10,
        resultsTotal: helper.initialRecipes.length,
      };

      test('can get fisrt page of pagination object ' +
        'by using base api url', async () => {
        const response = await api
          .get('/api/recipes')
          .expect(200)
          .expect('Content-Type', /application\/json/);
        const queriedResult = response.body;

        expect(queriedResult.pagination)
          .toEqual(expectedPaginationSection);
        expect(queriedResult.results)
          .toHaveLength(helper.initialRecipes.length);
      });

      test('can get fisrt page of pagination object ' +
        'by query with page number 1', async () => {
        const response = await api
          .get('/api/recipes?page=1')
          .expect(200)
          .expect('Content-Type', /application\/json/);
        const queriedResult = response.body;

        expect(queriedResult.pagination)
          .toEqual(expectedPaginationSection);
        expect(queriedResult.results)
          .toHaveLength(helper.initialRecipes.length);
      });

      test('can get fisrt page of pagination object ' +
        'by query with page number more than 1', async () => {
        const response = await api
          .get('/api/recipes?page=2')
          .expect(200)
          .expect('Content-Type', /application\/json/);
        const queriedResult = response.body;

        expect(queriedResult.pagination)
          .toEqual(expectedPaginationSection);
        expect(queriedResult.results)
          .toHaveLength(helper.initialRecipes.length);
      });

      test('can get fisrt page of pagination object ' +
        'by query with page number less than 1', async () => {
        const response = await api
          .get('/api/recipes?page=0')
          .expect(200)
          .expect('Content-Type', /application\/json/);
        const queriedResult = response.body;

        expect(queriedResult.pagination)
          .toEqual(expectedPaginationSection);
        expect(queriedResult.results)
          .toHaveLength(helper.initialRecipes.length);
      });

      test('can get fisrt page of pagination object ' +
        'by query with non-int page number', async () => {
        const response = await api
          .get('/api/recipes?page=lmaoxd')
          .expect(200)
          .expect('Content-Type', /application\/json/);
        const queriedResult = response.body;

        expect(queriedResult.pagination)
          .toEqual(expectedPaginationSection);
        expect(queriedResult.results)
          .toHaveLength(helper.initialRecipes.length);
      });
    });

    describe('using custom pagination setting', () => {
      const customResultsPerpage = 2;

      test('can get fisrt page of pagination object', async () => {
        const response = await api
          .get('/api/recipes?' +
            `itemsperpage=${customResultsPerpage}&` +
            'lastest=true&' +
            'popular=true')
          .expect(200)
          .expect('Content-Type', /application\/json/);
        const queriedResult = response.body;

        const expectedPagination = {
          page: 1,
          pageNext: 2,
          pagePrev: null,
          pageTotal:
            Math.ceil(helper.initialRecipes.length / customResultsPerpage),
          resultsCount: customResultsPerpage,
          resultsPerpage: customResultsPerpage,
          resultsTotal: helper.initialRecipes.length,
        };

        expect(queriedResult.pagination)
          .toEqual(expectedPagination);
        expect(queriedResult.results)
          .toHaveLength(customResultsPerpage);
      });

      test('can get second page of pagination object', async () => {
        const response = await api
          .get('/api/recipes?' +
            'page=2&' +
            `itemsperpage=${customResultsPerpage}&` +
            'lastest=true&' +
            'popular=true')
          .expect(200)
          .expect('Content-Type', /application\/json/);
        const queriedResult = response.body;

        const expectResultsCount =
          helper.initialRecipes.length % customResultsPerpage > 0 ?
            helper.initialRecipes.length % customResultsPerpage :
            customResultsPerpage;

        const expectedPagination = {
          page: 2,
          pageNext:
            helper.initialRecipes.length > customResultsPerpage * 2 ?
              3 : null,
          pagePrev: 1,
          pageTotal:
            Math.ceil(helper.initialRecipes.length / customResultsPerpage),
          resultsCount: expectResultsCount,
          resultsPerpage: customResultsPerpage,
          resultsTotal: helper.initialRecipes.length,
        };

        expect(queriedResult.pagination)
          .toEqual(expectedPagination);
        expect(queriedResult.results)
          .toHaveLength(expectResultsCount);
      });
    });
  });

  describe('adding a new recipe', () => {
    test('can add new recipe when sending ' +
      'correct authen token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();

      const recipe = helper.newRecipe;

      const response = await api
        .post('/api/recipes')
        .auth(user1Token, authenType)
        .send(recipe)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const returnedRecipe = response.body;
      expect(returnedRecipe.name).toEqual(recipe.name);
      expect(returnedRecipe.imagePath).toEqual(recipe.imagePath);
      expect(returnedRecipe.shortDescription).toEqual(recipe.shortDescription);
      expect(returnedRecipe.description).toEqual(recipe.description);
      expect(returnedRecipe.difficulty).toEqual(recipe.difficulty);
      expect(returnedRecipe.estimatedMinutes).toEqual(recipe.estimatedMinutes);
      expect(returnedRecipe.likes).toEqual(0);
      expect(returnedRecipe.user).toEqual(user1Id);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length + 1);

      const recipesNameAtEnd =
        recipesAtEnd.map((recipe) => {
          return recipe.name;
        });
      expect(recipesNameAtEnd).toContain(recipe.name);
    });

    test('received error code 401 when add new recipe without sending ' +
      'correct authen token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();

      const recipe = helper.newRecipe;

      await api
        .post('/api/recipes')
        .send(recipe)
        .expect(401);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);
    });
  });

  describe('getting a recipe', () => {
    test('can get a recipe with a valid id', async () => {
      const recipes = await helper.getRecipesInDb();
      const targetRecipe = recipes[0];

      const response = await api
        .get(`/api/recipes/id/${targetRecipe.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const returnedRecipe = response.body;
      expect(returnedRecipe.name).toEqual(targetRecipe.name);
      expect(returnedRecipe.imagePath).toEqual(targetRecipe.imagePath);
      expect(returnedRecipe.shortDescription)
        .toEqual(targetRecipe.shortDescription);
      expect(returnedRecipe.description).toEqual(targetRecipe.description);
      expect(returnedRecipe.difficulty).toEqual(targetRecipe.difficulty);
      expect(returnedRecipe.estimatedMinutes)
        .toEqual(targetRecipe.estimatedMinutes);
      expect(returnedRecipe.likes).toEqual(targetRecipe.likes);
      expect(returnedRecipe.user).toEqual(targetRecipe.user.toString());
    });

    test('received error code 404 when ' +
      'getting a recipe with a non-existed id', async () => {
      const id = await helper.generateNonExistingId();
      await api
        .get(`/api/recipes/id/${id}`)
        .expect(404);
    });
  });

  describe('updating a recipe', () => {
    test('can update a recipe with a valid id and a valid token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const targetRecipe = recipesAtStart[0];
      const newRecipeName = 'new Name';
      const updateRecipe = {
        ...targetRecipe,
        name: newRecipeName,
      };

      const response = await api
        .put(`/api/recipes/id/${targetRecipe.id}`)
        .auth(user1Token, authenType)
        .send(updateRecipe)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const returnedRecipe = response.body;
      expect(returnedRecipe.name).toEqual(newRecipeName);
      expect(returnedRecipe.imagePath).toEqual(targetRecipe.imagePath);
      expect(returnedRecipe.shortDescription)
        .toEqual(targetRecipe.shortDescription);
      expect(returnedRecipe.description).toEqual(targetRecipe.description);
      expect(returnedRecipe.difficulty).toEqual(targetRecipe.difficulty);
      expect(returnedRecipe.estimatedMinutes)
        .toEqual(targetRecipe.estimatedMinutes);
      expect(returnedRecipe.likes).toEqual(targetRecipe.likes);
      expect(returnedRecipe.user).toEqual(targetRecipe.user.toString());
      expect(returnedRecipe.ingredients)
        .toHaveLength(targetRecipe.ingredients.length);
      expect(returnedRecipe.steps)
        .toHaveLength(targetRecipe.steps.length);
      expect(returnedRecipe.comments)
        .toHaveLength(targetRecipe.comments.length);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);

      const recipesNameAtEnd =
        recipesAtEnd.map((recipe) => {
          return recipe.name;
        });
      expect(recipesNameAtEnd).toContain(newRecipeName);
      expect(recipesNameAtEnd).not.toContain(targetRecipe.name);
    });

    test('received error code 401 when update a recipe ' +
      'with a valid id and an invalid token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const targetRecipe = recipesAtStart[0];
      const newRecipeName = 'new Name';
      const updateRecipe = {
        ...targetRecipe,
        name: newRecipeName,
      };

      await api
        .put(`/api/recipes/id/${targetRecipe.id}`)
        .auth(user2Token, authenType)
        .send(updateRecipe)
        .expect(401);

      const targetRecipeAfterUpdate =
        await RecipeModel.findById(targetRecipe.id);

      expect(targetRecipeAfterUpdate.name).toEqual(targetRecipe.name);
      expect(targetRecipeAfterUpdate.imagePath).toEqual(targetRecipe.imagePath);
      expect(targetRecipeAfterUpdate.shortDescription)
        .toEqual(targetRecipe.shortDescription);
      expect(targetRecipeAfterUpdate.description)
        .toEqual(targetRecipe.description);
      expect(targetRecipeAfterUpdate.difficulty)
        .toEqual(targetRecipe.difficulty);
      expect(targetRecipeAfterUpdate.estimatedMinutes)
        .toEqual(targetRecipe.estimatedMinutes);
      expect(targetRecipeAfterUpdate.likes).toEqual(targetRecipe.likes);
      expect(targetRecipeAfterUpdate.user.toString())
        .toEqual(targetRecipe.user.toString());
      expect(targetRecipeAfterUpdate.ingredients)
        .toHaveLength(targetRecipe.ingredients.length);
      expect(targetRecipeAfterUpdate.steps)
        .toHaveLength(targetRecipe.steps.length);
      expect(targetRecipeAfterUpdate.comments)
        .toHaveLength(targetRecipe.comments.length);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);

      const recipesNameAtEnd =
        recipesAtEnd.map((recipe) => {
          return recipe.name;
        });
      expect(recipesNameAtEnd).not.toContain(newRecipeName);
      expect(recipesNameAtEnd).toContain(targetRecipe.name);
    });

    test('received error code 404 when update a recipe ' +
      'with a non-existed id', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const targetRecipe = recipesAtStart[0];
      const newRecipeName = 'new Name';
      const updateRecipe = {
        ...targetRecipe,
        name: newRecipeName,
      };

      const id = await helper.generateNonExistingId();

      await api
        .put(`/api/recipes/id/${id}`)
        .auth(user1Token, authenType)
        .send(updateRecipe)
        .expect(404);
    });
  });

  describe('deleting a recipe', () => {
    test('can delete a recipe with a valid id and a valid token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const targetRecipe = recipesAtStart[0];

      await api
        .delete(`/api/recipes/id/${targetRecipe.id}`)
        .auth(user1Token, authenType)
        .expect(204);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length - 1);

      const recipesNameAtEnd =
        recipesAtEnd.map((recipe) => {
          return recipe.name;
        });
      expect(recipesNameAtEnd).not.toContain(targetRecipe.name);
    });

    test('received error code 401 when delete a recipe with ' +
      'a valid id and a valid token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const targetRecipe = recipesAtStart[0];

      await api
        .delete(`/api/recipes/id/${targetRecipe.id}`)
        .auth(user2Token, authenType)
        .expect(401);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);

      const recipesNameAtEnd =
        recipesAtEnd.map((recipe) => {
          return recipe.name;
        });
      expect(recipesNameAtEnd).toContain(targetRecipe.name);
    });

    test('received error code 404 when delete a recipe with ' +
      'a non-existed id', async () => {
      const recipesAtStart = await helper.getRecipesInDb();

      const id = await helper.generateNonExistingId();

      await api
        .delete(`/api/recipes/id/${id}`)
        .auth(user1Token, authenType)
        .expect(404);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);
    });
  });

  describe('liking a recipe', () => {
    test('can like a recipe with a valid id and a valid token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const targetRecipe = recipesAtStart[0];

      const response = await api
        .put(`/api/recipes/like/${targetRecipe.id}`)
        .auth(user1Token, authenType)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const returnedRecipe = response.body;
      expect(returnedRecipe.name).toEqual(targetRecipe.name);
      expect(returnedRecipe.imagePath).toEqual(targetRecipe.imagePath);
      expect(returnedRecipe.shortDescription)
        .toEqual(targetRecipe.shortDescription);
      expect(returnedRecipe.description).toEqual(targetRecipe.description);
      expect(returnedRecipe.difficulty).toEqual(targetRecipe.difficulty);
      expect(returnedRecipe.estimatedMinutes)
        .toEqual(targetRecipe.estimatedMinutes);
      expect(returnedRecipe.likes).toEqual(targetRecipe.likes + 1);
      expect(returnedRecipe.user).toEqual(targetRecipe.user.toString());
      expect(returnedRecipe.ingredients)
        .toHaveLength(targetRecipe.ingredients.length);
      expect(returnedRecipe.steps)
        .toHaveLength(targetRecipe.steps.length);
      expect(returnedRecipe.comments)
        .toHaveLength(targetRecipe.comments.length);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);

      const targetRecipeAtEnd = await RecipeModel.findById(targetRecipe.id);
      expect(targetRecipeAtEnd.likes).toEqual(targetRecipe.likes + 1);
    });

    test('received error code 401 when like a recipe with ' +
      'a valid id but without a valid token', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const targetRecipe = recipesAtStart[0];

      await api
        .put(`/api/recipes/like/${targetRecipe.id}`)
        .expect(401);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);

      const targetRecipeAtEnd = await RecipeModel.findById(targetRecipe.id);
      expect(targetRecipeAtEnd.likes).toEqual(targetRecipe.likes);
    });

    test('received error code 404 when like a recipe with ' +
      'a non-existed id', async () => {
      const recipesAtStart = await helper.getRecipesInDb();
      const id = await helper.generateNonExistingId();

      await api
        .put(`/api/recipes/like/${id}`)
        .auth(user1Token, authenType)
        .expect(404);

      const recipesAtEnd = await helper.getRecipesInDb();
      expect(recipesAtEnd).toHaveLength(recipesAtStart.length);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
