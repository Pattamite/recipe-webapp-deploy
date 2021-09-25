const jwt = require('jsonwebtoken');
const logger = require('./logger');
const config = require('./config');

/** Log request by using logger
 * @param {Request} request - http request
 * @param {Response} response - http response
 * @param {NextFunction} next - next function for express
 */
function requestLogger(request, response, next) {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next();
}

/** Extract token from request authorization and add to request direactly
 * @param {Request} request - http request
 * @param {Response} response - http response
 * @param {NextFunction} next - next function for express
 */
function tokenExtractor(request, response, next) {
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7);
  }
  next();
}

/** Extract user id from request authorization and add to request direactly
 * @param {Request} request - http request
 * @param {Response} response - http response
 * @param {NextFunction} next - next function for express
 */
function userIdExtractor(request, response, next) {
  let token = null;
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    token = authorization.substring(7);
  }
  if (token) {
    const decodedToken = jwt.verify(token, config.SECRET);
    if (decodedToken.id) {
      request.userId = decodedToken.id;
    }
  }
  next();
}

/** Response code 404 when request unknown endpoint
 * @param {Request} request - http request
 * @param {Response} response - http response
 */
function unknownEndpoint(request, response) {
  response.status(404).send({ error: 'unknown endpoint' });
}

/** Response code 404 when request unknown endpoint
 * @param {Exception} error - exception
 * @param {Request} request - http request
 * @param {Response} response - http response
 * @param {NextFunction} next - next function for express
 * @return {Response} 400 response
 */
function errorHandler(error, request, response, next) {
  logger.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(400).json({ error: 'invalid token' });
  } else if (error.name === 'TokenExpiredError') {
    return response.status(400).json({ error: 'token expired' });
  }

  next(error);
}

module.exports = {
  requestLogger,
  tokenExtractor,
  userIdExtractor,
  unknownEndpoint,
  errorHandler,
};
