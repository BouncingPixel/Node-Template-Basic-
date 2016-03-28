'use strict';

// figure out how your config works. maybe it's a file with everything in it.
// maybe something way more complicated like Question Big had
// don't forget, config.port should be pulled from env on Heroku!
var config = require('./config')

// this example uses async, but the same could be done with Bluebird
var async = require('async');
var winston = require('winston');
winston.level = config.logLevel;

async.auto({
  // connect to all databases
  connectToDB: function(cb) {
    myDbStuff.connect(config.dbURL, function(err) {
      cb(err);
    });
  },

  connectToOtherDb: function(cb) {
    otherDb.connect(config.otherDbUrl, cb);
  },

  loadServer: ['connectToDB', 'connectToOtherDb', function(cb, results) {
    winston.debug('Loading express server');

    var express = require('express');

    var adaro = require('adaro');
    var lusca = require('lusca');

    var session = require('express-session');
    var sessionStore = null;

    winston.debug('Using Mongo for sessions');
    var MongoStore = require('connect-mongo')(session);
    sessionStore = new MongoStore({
      mongooseConnection: mongoose.connection, // if we used mongoose for example
      ttl: 14 * 24 * 3600,
      touchAfter: 3600
    });

    var flash = require('connect-flash');
    var cookieParser = require('cookie-parser');
    var compression = require('compression');
    var bodyParser = require('body-parser');

    var expressWinston = require('express-winston');

    var app = express();

    winston.silly('Configuring adaro for dust views');
    var dustEngine = adaro.dust({
      cache: process.env.NODE_ENV === 'production',

      helpers: [
        'dustjs-helpers'
        // require any other helper files in here
      ]
    });
    // if you absolutely needed an instance of dustjs, dustEngine.dust right here is that instance

    app.engine('dust', dustEngine);
    app.set('view engine', 'dust');
    app.set('views', 'views');

    // don't expose we use Express. need to know basis
    app.set('x-powered-by', false);

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
      secret: config.sessionSecret,
      resave: true,
      saveUninitialized: true
    }));

    app.use(flash());
    // if using passport, initialize it here:
    // app.use(passport.initialize());
    // app.use(passport.session());
    //
    // passport.serializeUser(function(user, done) {
    //   done(null, user.id);
    // });
    //
    // passport.deserializeUser(function(id, done) {
    //   User.findOne({_id: id}, function(err, user) {
    //     if (err) {
    //       return done(err);
    //     }
    //
    //     return done(null, user);
    //   });
    // });
    // set up any strategies for Passport
    // ...
    // if using the remember-me:
    // app.use(passport.authenticate('remember-me'));

    // optional, but sometimes handy!
    app.use(function(req, res, next) {
      // expose some variables to dust automatically, so we don't have to in the routes
      if (req.user) {
        res.locals.loggedInUser = {
          id: req.user.id,
          email: req.user.email,
          name: req.user.firstName,
          avatar: req.user.avatar
        };
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
      if (config.environment === 'testing') {
        return next();
      }

      var metaLog = config.environment !== 'development';
      var expressLog = config.environment === 'development';

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

    // enable lusca CSRF protection
    app.use(lusca({
      csrf: true,
      csp: false,
      xframe: 'SAMEORIGIN',
      p3p: false,
      hsts: false,
      xssProtection: true
    }));

    // load our routes file in
    winston.silly('Loading app routes');
    app.use(require('./routes'));

    // set up our general 404 error handler
    app.use(function(req, res, next) {
      winston.warn('404 error occurred while attempting to load ' + req.url);
      res.notFound(new Error('The page you are looking for could not be found'));
    });

    // set up our catch all error handler
    app.use(function(err, req, res, next) {
      winston.error('500 error occurred while attempting to load ' + req.url);
      res.serverError(err);
    });

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
  var server = app.listen(config.port, function() {
    console.log('App listening on port %s', config.port);
  });
});
