'use strict';

// Ensure we're in the project directory, so relative paths work as expected
process.chdir(__dirname);

var inProduction = process.env.NODE_ENV === 'production' && process.env.DEV_MODE !== 'true';

var nconf = require('nconf');
nconf.argv()
  .env()
  .file({ file: 'config/local.json' })
  .defaults({
    port: 3000,
    requireSSL: false,
    logLevel: 'debug',
    redirectOn401: '/login',

    maxFailTries: 3, // after this many tries, start locks
    maxLockTime: 1 * 3600 * 1000, // maximum amount of a time an account may be locked for

    // Be sure to set the defaults here
  });

// this example uses async, but the same could be done with Bluebird
var async = require('async');
var bluebird = require('bluebird');
var mongoose = require('mongoose');
var winston = require('winston');
winston.level = nconf.get('logLevel');

// never include anything that may include a model before mongoose has connected
// do it in loadServer

mongoose.Promise = bluebird;

async.auto({
  // connect to all databases
  connectToDB: function(cb) {
    mongoose.connect(nconf.get('dbURL'), {autoindex: !inProduction}, function(err) {
      cb(err);
    });
  },

  loadServer: ['connectToDB', function(cb, results) {
    // now anything that may include a model may be used
    winston.debug('Loading express server');

    var express = require('express');
    var PassportController = require('./controllers/PassportController');

    var dust = require('dustjs-linkedin');
    var cons = require('consolidate');
    var csrf = require('csurf');

    var session = require('express-session');
    var sessionStore = null;

    winston.debug('Using Mongo for sessions');
    var MongoStore = require('connect-mongo')(session);
    sessionStore = new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 14 * 24 * 3600,
      touchAfter: 3600
    });

    var flash = require('connect-flash');
    var cookieParser = require('cookie-parser');
    var compression = require('compression');
    var bodyParser = require('body-parser');

    var expressWinston = require('express-winston');

    var app = express();

    winston.silly('Configuring consolidate for dust views');
    app.engine('dust', cons.dust);
    app.set('view engine', 'dust');
    app.set('views', 'views');
    app.set('view cache', inProduction);

    // don't expose we use Express. need to know basis
    app.set('x-powered-by', false);

    if (nconf.get('requireSSL') === true || nconf.get('requireSSL') === 'true') {
      app.use(function(req, res, next) {
        if (req.headers['x-forwarded-proto'] !== 'https') {
          return res.redirect(['https://', req.get('Host'), req.url].join(''));
        }

        res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
      });
    }

    // compression should be before the statics and other routes
    app.use(compression());

    winston.silly('Configuring routes for statics');
    app.use(express.static('assets'));

    winston.silly('Loading res-responses');
    app.use(require('./responses/'));

    winston.silly('Configuring util functions');
    app.use(function(req, res, next) {
      req.wantsJSON = req.xhr || (req.accepts('html', 'json') === 'json');
      next();
    });

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

    passport.serializeUser(PassportController.serializeUser);
    passport.deserializeUser(PassportController.deserializeUser);

    passport.use('login', PassportController.loginStrategy);
    passport.use('passwordless', PassportController.passwordlessStrategy);
    passport.use('remember-me', PassportController.rememberMeStrategy);
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

      var metaLog = inProduction;
      var expressLog = !inProduction;

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
    app.use(require('./routes'));

    // set up our general 404 error handler
    app.use(function(req, res, next) {
      var error = new Error('404 error occurred while attempting to load ' + req.url);
      error.status = 404;
      // pass it down to the general error handler
      next(error);
    });

    // the catch all and, general error handler. use next(err) to send it through this
    app.use(require('./utils/generalErrorHandler'));

    cb(null, app);
  }]
}, function(err, results) {
  if (err) {
    winston.error('Failed to initialize server');
    winston.error(err);
    process.exit(1);
    return;
  }

  var app = results.loadServer;
  var server = app.listen(nconf.get('port'), function() {
    console.log('App listening on port %s', nconf.get('port'));
  });
});
