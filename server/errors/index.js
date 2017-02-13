const makeGenericError = require('./make-generic-error');

global.ServerErrors = {
  BadRequest: makeGenericError(400, 'Your request did not contain the necessary information'),
  NotAuthorized: makeGenericError(401, 'You may need to login to access that'),
  Banned: makeGenericError(402, 'Account cannot access that page'),
  Forbidden: makeGenericError(403, 'You do not have permission to access that'),
  NotFound: makeGenericError(404, 'The page requested was not found'),
  AccountLocked: makeGenericError(429, 'Your account is locked'),
  ServerError: makeGenericError(500, 'An internal server error occurred')
};
