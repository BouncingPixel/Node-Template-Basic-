'use strict';

require('./errors/');
const nconf = require('nconf');

const winston = require('winston');
const csrf = require('csurf');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressWinston = require('express-winston');

// now anything that may include a model may be used
winston.debug('Loading express server');

const express = require('express');
const app = express.Router();

const requireHttps = nconf.get('requireHTTPS') && nconf.get('requireHTTPS').toString() === 'true';
const httpsRedirect = nconf.get('httpsRedirect') && nconf.get('httpsRedirect').toString() === 'true';

const requireDomain = nconf.get('forceDomain') && nconf.get('forceDomain').toString() === 'true';
const sitedomain = nconf.get('domain');

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

winston.debug('Using Mongo for sessions');
const sessionStore = new MongoStore({
  mongooseConnection: mongoose.connection,
  ttl: 14 * 24 * 3600,
  touchAfter: 3600
});

winston.debug('Configuring util functions');
app.use(function(req, res, next) {
  req.wantsJSON = req.xhr || (req.accepts('html', 'json') === 'json');
  next();
});

app.use(require('./responses/'));

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

app.use(passport.initialize());
app.use(passport.session());

const PassportService = require('./services/passport-service');
passport.serializeUser(PassportService.serializeUser);
passport.deserializeUser(PassportService.deserializeUser);

passport.use(PassportService.localStrategy);

if (PassportService.passwordlessStrategy) {
  passport.use('passwordless', PassportService.passwordlessStrategy);
}
if (PassportService.rememberMeStrategy) {
  passport.use('remember-me', PassportService.rememberMeStrategy);
}
if (PassportService.facebookStrategy) {
  passport.use(PassportService.facebookStrategy);
}
if (PassportService.googleStrategy) {
  passport.use(PassportService.googleStrategy);
}
if (PassportService.twitterStrategy) {
  passport.use(PassportService.twitterStrategy);
}
if (PassportService.linkedinStrategy) {
  passport.use(PassportService.linkedinStrategy);
}

app.use(passport.authenticate('remember-me'));

// optional, but sometimes handy!
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
app.use(require('./utils/auto-static-routes')());

// set up our general 404 error handler
app.use(function(req, res, next) {
  // if headers were sent, we assume something must have handled it and just ended with a next() call anyway
  if (!res.headersSent) {
    // pass it down to the general error handler
    next(ServerErrors.NotFound('404 error occurred while attempting to load ' + req.url));
  }
});

// the catch all and, general error handler. use next(err) to send it through this
app.use(require('./utils/general-error-handler'));

module.exports = app;
