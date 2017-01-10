const makeGenericError = require('./makeGenericError');

global.BadRequest = makeGenericError(400, 'Sending empty 400 ("Bad Request") response', 'errors/400');
global.NotAuthorized = makeGenericError(401, 'Sending empty 401 ("Not Authorized") response', 'errors/401');
global.Banned = makeGenericError(402, 'Sending empty 402 ("Banned") response', 'errors/402');
global.Forbidden = makeGenericError(403, 'Sending empty 403 ("Forbidden") response', 'errors/403');
global.NotFound = makeGenericError(404, 'Sending empty 404 ("Not Found") response', 'errors/404');
global.ServerError = makeGenericError(500, 'Sending empty 500 ("Internal Server Error") response', 'errors/500');
