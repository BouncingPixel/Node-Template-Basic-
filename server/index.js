'use strict';

const nconf = require('nconf');
const path = require('path');

const winston = require('winston');
const csrf = require('csurf');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressWinston = require('express-winston');

const HttpErrors = require('@bouncingpixel/http-errors');

// now anything that may include a model may be used
winston.debug('Loading express server');

const express = require('express');
const app = express.Router();

let databaseAdapter = null;
let authAdapter = null;
try {
  databaseAdapter = require('@bouncingpixel/mongoose-db');
} catch (_e) {
  console.log(_e)
  databaseAdapter = null;
}
if (databaseAdapter) {
  try {
    const authAdapterImpl = databaseAdapter.passportImplFactory(require('./models/user'));
    authAdapter = require('@bouncingpixel/passport-auth')(authAdapterImpl);
  } catch (_e) {
    authAdapter = null;
  }
}

const requireHttps = nconf.get('requireHTTPS') && nconf.get('requireHTTPS').toString() === 'true';
const httpsRedirect = nconf.get('httpsRedirect') && nconf.get('httpsRedirect').toString() === 'true';

const requireDomain = nconf.get('forceDomain') && nconf.get('forceDomain').toString() === 'true';
const sitedomain = nconf.get('siterootHost');

if (requireHttps || requireDomain) {
  app.use(function(req, res, next) {
    const host = requireDomain ? sitedomain : req.get('Host');

    if (requireHttps && httpsRedirect) {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', host, req.url].join(''));
      }

      res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (requireDomain && req.get('Host') !== sitedomain) {
      const proto = requireHttps ? 'https://' : (req.protocol + '://');
      return res.redirect([proto, host, req.url].join(''));
    }

    next();
  });
}

if (nconf.get('WEBTOOLS_VERIF_ID')) {
  const webtoolsVerifId = nconf.get('WEBTOOLS_VERIF_ID');
  const fileName = `/${webtoolsVerifId}.html`;
  const fileContents = `google-site-verification: ${webtoolsVerifId}.html`;

  app.get(fileName, function(req, res) {
    res.status(200).send(fileContents);
  });
}

winston.debug('Setting up session store');
const sessionStore = databaseAdapter ?
  databaseAdapter.getSessionStore(session) : (new session.MemoryStore());

winston.debug('Adding universal-response functions');
app.use(require('@bouncingpixel/universal-response'));

// middleware comes after statics, so we handle the statics without going thru middleware
winston.silly('Configuring middlewares');
app.use(cookieParser());
app.use(session({
  store: sessionStore,
  secret: nconf.get('sessionSecret'),
  resave: true,
  saveUninitialized: true
}));

app.use(flash());

if (authAdapter) {
  authAdapter.init(app);
}

app.use(function(req, res, next) {
  // expose some variables to dust automatically, so we don't have to in the routes
  if (req.user) {
    res.locals.loggedInUser = req.user;
  }

  res.locals.requireHTTPS = nconf.get('requireHTTPS');
  res.locals.sitedomain = sitedomain;
  res.locals.gatrackerid = nconf.get('gatrackerid');
  res.locals.facebookpixelcode = nconf.get('facebookpixelcode');

  let pagecanonProto = '';
  if (res.locals.requireHTTPS && res.locals.requireHTTPS.toString() === 'true') {
    pagecanonProto = 'https';
  } else {
    pagecanonProto = 'http';
  }

  res.locals.pagecanonURL = `${pagecanonProto}://${sitedomain}${req.path}`;

  res.locals.ENV = nconf.get('client');

  if (process.env.NODE_ENV === 'production') {
    res.locals.NODE_ENV_PRODUCTION = true;
  }

  // the flash vars too for display
  if (req.method !== 'POST') {
    res.locals.flashError = req.flash('error');
    res.locals.flashWarn = req.flash('warn');
    res.locals.flashSuccess = req.flash('success');
    res.locals.flashInfo = req.flash('info');
  }

  next();
});

// set up logging of express handling
app.use(expressWinston.logger({
  winstonInstance: winston,
  statusLevels: true,
  expressFormat: true,
  msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms '
}));

// urlencoded is needed for standard forms. jquery can send urlencoded as well.
// there's also jsonencoded which is useful for other XHR requests. both can be enabled at the same time.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// enable CSRF protection
const csrfMiddleware = csrf({cookie: true});
app.use(function(req, res, next) {
  // wrap it, because multer complicates things.
  if (req.headers['content-type'] && req.headers['content-type'].substr(0, 19).toLowerCase() === 'multipart/form-data') {
    next();
    return;
  }

  csrfMiddleware(req, res, next);
});

// enable other protections for the site
app.use(function(req, res, next) {
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('X-FRAME-OPTIONS', 'SAMEORIGIN');

  // originally, this was non-POST only, because of issues with POST+render
  // the smallest use-case seemed to work. so instead, using a lazy fetch for the CSRF
  // DustJS will call the function if it needs the value, otherwise, the CSRF isn't generated
  let csrfToken = null;
  res.locals._csrf = function() {
    if (!csrfToken) {
      csrfToken = req.csrfToken();
    }
    return csrfToken;
  };

  next();
});

// load our routes file in
winston.silly('Loading app routes');
const routes = require('./routes');
for (let r in routes) {
  app.use(r, routes[r]);
}

// add ability to display static pages inside the views/pages/ directory
app.use(require('@bouncingpixel/auto-static-routes')(path.resolve(__dirname, '../views/'), 'static'));

// set up our general 404 error handler
app.use(function(req, res, next) {
  // if headers were sent, we assume something must have handled it and just ended with a next() call anyway
  if (!res.headersSent) {
    // pass it down to the general error handler
    next(new HttpErrors.NotFoundError('404 error occurred while attempting to load ' + req.url));
  }
});

// the catch all and, general error handler. use next(err) to send it through this
app.use(require('@bouncingpixel/error-router')({
  enableFlash: true,
  redirectOn401: '/',
  sessionRedirectVar: 'redirectto'
}));

module.exports = app;
