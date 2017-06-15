let passportAuth = null;
try {
  passportAuth = require('@bouncingpixel/passport-auth')();
} catch (_e) {
  passportAuth = null;
}

if (!passportAuth) {
  module.exports = {};
  return;
}

module.exports = {
  use: passportAuth.middlewares.requireUserRole('admin')
};
