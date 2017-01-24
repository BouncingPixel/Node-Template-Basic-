const makeGenericError = require('./makeGenericError');

global.ServerErrors = {
  BadRequest: makeGenericError(400, 'Your request did not contain the necessary information', 'errors/400'),
  NotAuthorized: makeGenericError(401, 'You may need to login to access that', 'errors/401'),
  Banned: makeGenericError(402, 'Account cannot access that page', 'errors/4xx'),
  Forbidden: makeGenericError(403, 'You do not have permission to access that', 'errors/403'),
  NotFound: makeGenericError(404, 'The page requested was not found', 'errors/404'),
  AccountLocked: makeGenericError(429, 'Your account is locked', 'errors/4xx'),
  ServerError: makeGenericError(500, 'An internal server error occurred', 'errors/500')
};
