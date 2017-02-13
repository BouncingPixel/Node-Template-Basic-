
module.exports = function makeGenericError(statusCode, defaultMessage) {
  return function makeError(message, view) {
    let error = new Error(message || defaultMessage);
    error.status = statusCode;
    error.showView = view;
    return error;
  };
};
