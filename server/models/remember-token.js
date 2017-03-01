'use strict';

const crypto = require('crypto');

const mongoose = require('mongoose');

const RememberTokenSchema = require('../../schemas/remember-token');

RememberTokenSchema.statics.generate = function generate(userId, done) {
  const _self = this;

  crypto.randomBytes(48, function(ex, buf) {
    if (ex) {
      return done(ex);
    }
    const token = buf.toString('hex');

    _self.create({token: token, user: userId}, function(err) {
      if (err) {
        // while the done could be merged, keep separate to not even pass the token back
        return done(err);
      }
      done(null, token);
    });
  });
};

RememberTokenSchema.statics.consume = function consume(token, done) {
  this.findOne({token: token}, function(err, res) {
    if (err) {
      return done(err);
    }

    if (!res) {
      return done();
    }

    return done(null, res.user);
  });
};

module.exports = mongoose.model('remembertoken', RememberTokenSchema);
