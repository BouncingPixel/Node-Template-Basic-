
module.exports = function makeGenericError(statusCode, defaultMessage, defaultView) {
  return function makeError(message, view) {
    let error = new Error(message || defaultMessage);
    error.status = statusCode;
    error.showView = view || defaultView;
    return error;
  };
};
