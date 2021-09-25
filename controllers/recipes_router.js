const expressRouter = require('express').Router;
const RecipeModel = require('../models/recipe_model');
const UserModel = require('../models/user_model');
const helper = require('./router_helper');

const recipesRouter = expressRouter();

const defaultItemsPerPage = 10;

recipesRouter.get('/', async (request, response, next) => {
  try {
    const pageNumber = request.query.page ? request.query.page : 1;
    const itemsCountPerPage = request.query.itemsperpage ?
      request.query.itemsperpage : defaultItemsPerPage;
    let sortOption = {};
    let useCustomSortOption = false;

    if (request.query.lastest) {
      sortOption = {
        ...sortOption,
        date: 'descending',
      };
      useCustomSortOption = true;
    }

    if (request.query.popular) {
      sortOption = {
        ...sortOption,
        likes: 'descending',
      };
      useCustomSortOption = true;
    }

    let paginationObject;

    if (useCustomSortOption) {
      paginationObject = await helper.getPaginationFromModel(
        model = RecipeModel,
        page = pageNumber,
        itemsPerPage = itemsCountPerPage,
        sort = sortOption,
        populate = 'user',
      );
    } else {
      paginationObject = await helper.getPaginationFromModel(
        model = RecipeModel,
        page = pageNumber,
        itemsPerPage = itemsCountPerPage,
        populate = 'user',
      );
    }

    response.json(paginationObject);
  } catch (exception) {
    next(exception);
  }
});

recipesRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body;
    const user = await UserModel.findById(request.userId);
    if (!user) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }

    const recipe = new RecipeModel({
      name: body.name,
      imagePath: body.imagePath,
      shortDescription: body.shortDescription,
      description: body.description,
      difficulty: body.difficulty,
      estimatedMinutes: body.estimatedMinutes,
      user: user._id,
      date: new Date(),
      ingredients: body.ingredients,
      steps: body.steps,
      comments: [],
    });

    const savedRecipe = await recipe.save();
    response.json(savedRecipe);
  } catch (exception) {
    next(exception);
  }
});

recipesRouter.get('/id/:id', async (request, response, next) => {
  try {
    const recipe =
      await (await RecipeModel.findById(request.params.id)).populate('user');
    if (recipe) {
      response.json(recipe);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

recipesRouter.put('/id/:id', async (request, response, next) => {
  try {
    const body = request.body;
    const user = await UserModel.findById(request.userId);
    if (!user) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }

    const recipe = await RecipeModel.findById(request.params.id);
    if (!recipe) {
      response.status(404).end();
    }
    if (recipe.user.toString() !== user._id.toString()) {
      return response.status(401).json({ error: 'permission denied' });
    }

    const newRecipe = {
      name: body.name,
      imagePath: body.imagePath,
      shortDescription: body.shortDescription,
      description: body.description,
      difficulty: body.difficulty,
      estimatedMinutes: body.estimatedMinutes,
      ingredients: body.ingredients,
      steps: body.steps,
    };

    const savedRecipe = await RecipeModel.findByIdAndUpdate(
      request.params.id, newRecipe, { new: true },
    );
    if (savedRecipe) {
      response.json(savedRecipe);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

recipesRouter.delete('/id/:id', async (request, response, next) => {
  try {
    const user = await UserModel.findById(request.userId);
    if (!user) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }

    const recipe = await RecipeModel.findById(request.params.id);
    if (!recipe) {
      response.status(404).end();
    }
    if (recipe.user.toString() !== user._id.toString()) {
      return response.status(401).json({ error: 'permission denied' });
    }

    await RecipeModel.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } catch (exception) {
    next(exception);
  }
});

recipesRouter.put('/like/:id', async (request, response, next) => {
  try {
    const user = await UserModel.findById(request.userId);
    if (!user) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }

    const recipe = await RecipeModel.findById(request.params.id);
    if (!recipe) {
      response.status(404).end();
    }

    const newRecipe = {
      likes: recipe.likes + 1,
    };

    const savedRecipe = await RecipeModel.findByIdAndUpdate(
      request.params.id, newRecipe, { new: true },
    );
    if (savedRecipe) {
      response.json(savedRecipe);
    } else {
      response.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

// recipesRouter.post('/comment/:id', async (request, response, next) => {
//   try {
//     const user = await UserModel.findById(request.userId);
//     if (!user) {
//       return response.status(401)
//         .json({ error: 'token missing or invalid' });
//     }

//     const recipe = await RecipeModel.findById(request.params.id);
//     if (!recipe) {
//       response.status(404).end();
//     }

//     const body = request.body;

//     const newComment = {
//       text: body.text,
//       date: new Date(),
//       user: user._id,
//     };

//     const newRecipe = {
//       comments: recipe.comments.concat(newComment),
//     };

//     const savedRecipe = await RecipeModel.findByIdAndUpdate(
//       request.params.id, newRecipe, { new: true },
//     );
//     if (savedRecipe) {
//       response.json(savedRecipe);
//     } else {
//       response.status(404).end();
//     }
//   } catch (exception) {
//     next(exception);
//   }
// });

// TODO: update comment
// TODO: delete comment

module.exports = recipesRouter;
