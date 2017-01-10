
module.exports = function makeGenericError(status, defaultMessage, defaultView) {
  return function makeError(message, view) {
    var error = new Error(message || defaultMessage);
    error.status = status;
    error.showView = view || defaultView;
  };
};
