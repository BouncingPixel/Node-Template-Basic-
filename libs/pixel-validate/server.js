const pixelValidate = require('./validate');

exports.validate = pixelValidate.validateAll;
exports.validateField = pixelValidate.validateField;

exports.ValidateMiddlware = function(Schema, redirectto) {
  return function(req, res, next) {
    const data = req.body;

    pixelValidate.validateAll(data, Schema).then(function() {
      next();
    }).catch(function(err) {
      if (!err.errors) {
        next(err);
        return;
      }

      const errors = err.errors;

      Object.keys(errors).forEach((prop) => {
        const errorInfo = errors[prop];
        const message = errorInfo.message;

        req.flash('error', message);
      });

      if (!redirectto) {
        res.redirect(req.path);
      } else if (redirectto instanceof Function) {
        redirectto(req, res);
      } else {
        res.redirect(redirectto);
      }
    });
  };
};
