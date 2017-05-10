'use strict';

const nconf = require('nconf');
const bluebird = require('bluebird');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const RememberMeStrategy = require('passport-remember-me').Strategy;

const User = require('../models/user');
const RememberToken = require('../models/remember-token');
const LoginLocker = require('../models/login-locker');

/*
login attempts need to track:
- email
- failed counter
- lockedUntil

if lockedUntil, then don't do anything
else:
  on success, reset failed counter
  on fail, add 1 to failed counter. if it became > threshold, then set lockedUntil = MIN(maxLockTime, ((failCounter - 3) ** 2) * 5)
*/

function generalLogin(req, user, done) {
  if (!user) {
    return done(ServerErrors.NotAuthorized('Invalid username or password'));
  }

  if (user.isLocked) {
    return done(ServerErrors.AccountLocked('User account is locked'));
  }

  const saveRedirectTo = req.session.redirectto;

  req.session.regenerate(function() {
    req.logIn(user, function(err) {
      if (err) {
        return done(err);
      }

      // if there's anything specific about the session that needs to be stored
      req.session.startAt = new Date().getTime();
      if (saveRedirectTo) {
        req.session.redirectto = saveRedirectTo;
      }
      done();
    });
  });
}

const PassportService = {

  serializeUser: function(user, done) {
    done(null, JSON.stringify({id: user.id}));
  },

  deserializeUser: function(req, info, done) {
    const obj = JSON.parse(info);

    User.findOne({_id: obj.id}, function(err, user) {
      done(err, user);
    });
  },

  localStrategy: new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    bluebird.coroutine(function*() {
      const lowerEmail = email.toLowerCase();

      let [user, lockInfo] = yield Promise.all([
        User.findOne({
          email: lowerEmail,
          role: {$ne: 'noaccess'},
          deactivatedat: null
        }),

        LoginLocker.findOne({email: lowerEmail})
      ]);

      if (lockInfo && lockInfo.lockedUntil && new Date() <= lockInfo.lockedUntil) {
        // do absolutely nothing if locked
        return false;
      }

      // TODO: add audit log

      const checkPassword = user ? user.password : 'THISISNOTVALIDPASSWORD';
      const isValid = yield bcrypt.compare(password, checkPassword);

      if (isValid) {
        if (lockInfo) {
          lockInfo.failedCount = 0;
          yield lockInfo.save();
        }

        return user;
      } else {
        if (!lockInfo) {
          lockInfo = new LoginLocker();
        }
        // TODO: can we make this atomic?
        lockInfo.failedCount += 1;

        const maxFailTries = parseInt(nconf.get('maxFailTries'), 10);
        const maxLockTime = parseInt(nconf.get('maxLockTime'), 10);
        if (lockInfo.failedCount > maxFailTries) {
          const lockedForMs = Math.min(
            maxLockTime,
            Math.pow(lockInfo.failedCount - maxFailTries, 2) * 5
          );

          const lockedUntilTime = new Date().getTime() + lockedForMs;
          lockInfo.lockedUntil = new Date(lockedUntilTime);
        }

        yield lockInfo.save();
        return false;
      }
    })().then(function(toReturn) {
      done(null, toReturn);
      return null;
    }).catch(function(err) {
      done(err);
    });
  }),

  passwordlessStrategy: new LocalStrategy({
    usernameField: 'email',
    passwordField: 'token',
    passReqToCallback: true
  },
  function(req, email, token, done) {
    bluebird.coroutine(function*() {
      const lowerEmail = email.toLowerCase();

      let [user, lockInfo] = yield Promise.all([
        User.findOne({
          email: lowerEmail,
          role: {$ne: 'noaccess'},
          deactivatedat: null,
          tokenexpire: {$gte: new Date()}
        }),

        LoginLocker.findOne({email: lowerEmail})
      ]);

      if (lockInfo && lockInfo.lockedUntil && new Date() <= lockInfo.lockedUntil) {
        // do absolutely nothing if locked
        return false;
      }

      const checkToken = user ? user.logintoken : 'THISISNOTVALIDPASSWORD';
      const isValid = yield bcrypt.compare(token, checkToken);

      // we don't mess with the lock out with tokens, but we could
      if (!isValid) {
        return false;
      }

      user.logintoken = null;
      user.tokenexpire = null;
      yield user.save();

      return user;
    })().then(function(toReturn) {
      done(null, toReturn);
      return null;
    }).catch(done);
  }),

  rememberMeStrategy: new RememberMeStrategy(function(token, done) {
    RememberToken.consume(token, function(err, userId) {
      if (err) {
        return done(err);
      }
      if (!userId) {
        return done(null, false);
      }

      return User.findOne({_id: userId}).exec(done);
    });
  },
  function(user, done) {
    RememberToken.generate(user.id, function(err, token) {
      if (err) {
        return done(err);
      }

      return done(null, token);
    });
  }),

  // only issues remember-me token if the POST body variable rememberme is "true" (string or boolean)
  issueRememberMe: function(req, res, next) {
    if (!req.user) {
      return next();
    }

    if (req.method.toLowerCase() !== 'post' || !(req.body.rememberme === true || req.body.rememberme === 'true')) {
      return next();
    }

    RememberToken.generate(req.user.id, function(err, token) {
      if (err) {
        return next(err);
      }

      let cookieInfo = {path: '/', httpOnly: true, maxAge: 2 * 7 * 24 * 3600 * 1000};
      if (nconf.get('requireHTTPS') === true || nconf.get('requireHTTPS') === 'true') {
        cookieInfo.secure = true;
      }

      res.cookie('remember_me', token, cookieInfo);
      return next();
    });
  },

  login: function(req, res, next) {
    passport.authenticate('local', function(err, user) {
      if (err) {
        return next(err);
      }

      // passport's default behavior is not to prevent session fixation, so we do it ourselves
      generalLogin(req, user, next);
      // next();
    })(req, res, next);
  },

  passwordlessLogin: function(req, res, next) {
    passport.authenticate('passwordless', function(err, user) {
      if (err) {
        return next(err);
      }

      generalLogin(req, user, next);
    })(req, res, next);
  },

  logout: function(req, res, next) {
    res.clearCookie('remember_me');
    req.logout();
    req.session.destroy(function() {
      next();
    });
  }

};

const baseUrl = (nconf.get('requireHTTPS') ? 'https://' : 'http://') + nconf.get('domain');

// be user to uncomment the necessary areas in User model before enabling
if (nconf.get('sso:facebook:appid') && nconf.get('sso:facebook:secret')) {
  const FacebookStrategy = require('passport-facebook').Strategy;

  PassportService.facebookStrategy = new FacebookStrategy({
    clientID: nconf.get('sso:facebook:appid'),
    clientSecret: nconf.get('sso:facebook:secret'),
    callbackURL: baseUrl + '/auth/facebook/callback',
    enableProof: true,
    // add  'picture.type(large)' if you want the profile pic
    profileFields: ['id', 'first_name', 'last_name', 'email'],
    passReqToCallback: true
  }, authWithSso);
}

if (nconf.get('sso:google:clientid') && nconf.get('sso:google:secret')) {
  const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

  PassportService.googleStrategy = new GoogleStrategy({
    clientID: nconf.get('sso:google:clientid'),
    clientSecret: nconf.get('sso:google:secret'),
    callbackURL: baseUrl + '/auth/google/callback',
    passReqToCallback: true
  }, authWithSso);
}

if (nconf.get('sso:twitter:key') && nconf.get('sso:twitter:secret')) {
  const TwitterStrategy = require('passport-twitter').Strategy;

  PassportService.twitterStrategy = new TwitterStrategy({
    consumerKey: nconf.get('sso:twitter:key'),
    consumerSecret: nconf.get('sso:twitter:secret'),
    callbackURL: baseUrl + '/auth/twitter/callback',
    passReqToCallback: true
  }, authWithSso);
}

if (nconf.get('sso:linkedin:key') && nconf.get('sso:linkedin:secret')) {
  const LinkedInStrategy = require('passport-linkedin').Strategy;

  PassportService.linkedinStrategy = new LinkedInStrategy({
    consumerKey: nconf.get('sso:linkedin:key'),
    consumerSecret: nconf.get('sso:linkedin:secret'),
    callbackURL: baseUrl + '/auth/linkedin/callback',
    // add 'public-profile-url' if you want the profile pic
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline'],
    passReqToCallback: true
  }, authWithSso);
}

function* associateProfile(user, profile) {
  user[profile.provider + 'Id'] = profile.id;

  // if you wanted to store the user's social URLs:
  // if (profile.provider === 'facebook') {
  //   if (!user.socialFacebookUrl || !user.socialFacebookUrl.length) {
  //     user.socialFacebookUrl = 'https://www.facebook.com/' + profile.id;
  //   }
  // } else if (profile.provider === 'linkedin') {
  //   // LinkedIn can provide us with title if we wanted it
  //   if ((!user.title || !user.title.length) && profile._json.headline) {
  //     user.title = profile._json.headline;
  //   }

  //   if (!user.socialLinkedinUrl || !user.socialLinkedinUrl.length) {
  //     user.socialLinkedinUrl = profile._json.publicProfileUrl;
  //   }
  // } else if (profile.provider === 'twitter') {
  //   if (!user.socialTwitterUrl || !user.socialTwitterUrl.length) {
  //     user.socialTwitterUrl = 'https://twitter.com/intent/user?user_id=' + profile.id;
  //   }
  // }

  return yield user.save();
}

function* continueWithProfile(profile) {
  let matchByProvider = {};
  matchByProvider[profile.provider + 'Id'] = profile.id;

  let user = yield User.findOne(matchByProvider);

  if (user) {
    return user;
  }

  // the template requires an email for login, but in reality, the email itself could be ignored
  // in that case, the user is required to log in with their social media forever,
  // unless they associate an email with their account later
  if (profile.emails == null || !Array.isArray(profile.emails) || profile.emails.length === 0) {
    // if the system does not require emails, just skip the look up based on email and go straight to create a new account
    throw ServerErrors.ServerError('Could not determine email to create an account');
  }

  const emails = profile.emails.map((info) => {
    return info.value.toLowerCase();
  });

  user = yield User.findOne({emailLowercase: {$in: emails}});

  // create a new account if one did not exist previously
  if (!user) {
    const userObj = {
      name: [profile.name.givenName, profile.name.familyName].join(' '),
      email: profile.emails[0].value
    };

    user = new User(userObj);
  }

  return yield* associateProfile(user, profile);
}

function* authWithSsoAsync(req, accessToken, refreshToken, profile) {
  if (req.user) {
    return yield* associateProfile(req.user, profile);
  }

  return yield* continueWithProfile(profile);
}

function authWithSso(req, accessToken, refreshToken, profile, done) {
  bluebird.coroutine(
    authWithSsoAsync(req, accessToken, refreshToken, profile)
  ).then((user) => {
    done(null, user);
  }).catch((err) => {
    done(err);
  });
}
module.exports = PassportService;
