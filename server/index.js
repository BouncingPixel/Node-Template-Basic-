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
const PassportService = require('./services/passport-service');

if (nconf.get('requireHTTPS') === true || nconf.get('requireHTTPS') === 'true') {
  app.use(function(req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }

    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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

passport.serializeUser(PassportService.serializeUser);
passport.deserializeUser(PassportService.deserializeUser);

passport.use('login', PassportService.loginStrategy);
passport.use('passwordless', PassportService.passwordlessStrategy);
passport.use('remember-me', PassportService.rememberMeStrategy);
app.use(passport.authenticate('remember-me'));

// optional, but sometimes handy!
app.use(function(req, res, next) {
  // expose some variables to dust automatically, so we don't have to in the routes
  if (req.user) {
    res.locals.loggedInUser = req.user;
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
app.use(function(req, res, next) {
  if (process.env.NODE_ENV === 'testing') {
    return next();
  }

  const metaLog = process.env.NODE_ENV === 'production';
  const expressLog = process.env.NODE_ENV !== 'production';

  return expressWinston.logger({
    winstonInstance: winston,
    statusLevels: true,
    expressFormat: expressLog,
    msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms ',
    meta: metaLog
  })(req, res, next);
});

// urlencoded is needed for standard forms. jquery can send urlencoded as well.
// there's also jsonencoded which is useful for other XHR requests. both can be enabled at the same time.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// enable CSRF protection
app.use(csrf({
  cookie: true
}));

// enable other protections for the site
app.use(function(req, res, next) {
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('X-FRAME-OPTIONS', 'SAMEORIGIN');
  res.locals._csrf = req.csrfToken();
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
  // pass it down to the general error handler
  next(ServerErrors.NotFound('404 error occurred while attempting to load ' + req.url));
});

// the catch all and, general error handler. use next(err) to send it through this
app.use(require('./utils/general-error-handler'));

module.exports = app;
