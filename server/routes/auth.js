'use strict';

let authAdapter = null;
try {
  authAdapter = require('@bouncingpixel/passport-auth')();
} catch (_e) {
  authAdapter = null;
}

if (!authAdapter) {
  module.exports = {};
  return;
}

// require any controllers and middleware in
const AuthController = require('../controllers/auth-controller');
const authMiddlewares = authAdapter.middlewares;

const routes = {
  '/login': {
    post: {
      before: [
        authMiddlewares.requireLoggedOut,
        authMiddlewares.login,

        // if rememberme is desired, uncomment it
        authMiddlewares.issueRememberMe
      ],

      handler: AuthController.login,

      after: [AuthController.failedLogin]
    }
  },

  '/token': {
    post: {
      before: [
        authMiddlewares.requireLoggedOut,
        authMiddlewares.tokenLogin
      ],

      handler: AuthController.token,

      after: [AuthController.failedToken]
    }
  },

  '/logout': {
    get: {
      before: [authMiddlewares.logout],
      handler: AuthController.logout
    },

    post: {
      before: [authMiddlewares.logout],
      handler: AuthController.logout
    }
  }
};

if (authMiddlewares.facebookStart) {
  routes['/facebook'] = {
    get: {
      handler: authMiddlewares.facebookStart
    },

    '/callback': {
      get: {
        before: [authMiddlewares.facebookCallback],
        handler: AuthController.oathPostRedirect
      }
    }
  };
}

if (authMiddlewares.googleStart) {
  routes['/google'] = {
    get: {
      handler: authMiddlewares.googleStart
    },

    '/callback': {
      get: {
        before: [authMiddlewares.googleCallback],
        handler: AuthController.oathPostRedirect
      }
    }
  };
}

if (authMiddlewares.twitterStart) {
  routes['/twitter'] = {
    get: {
      handler: authMiddlewares.twitterStart
    },

    '/callback': {
      get: {
        before: [authMiddlewares.twitterCallback],
        handler: AuthController.oathPostRedirect
      }
    }
  };
}

if (authMiddlewares.linkedinStart) {
  routes['/linkedin'] = {
    get: {
      handler: authMiddlewares.linkedinStart
    },

    '/callback': {
      get: {
        before: [authMiddlewares.linkedinCallback],
        handler: AuthController.oathPostRedirect
      }
    }
  };
}

module.exports = routes;
