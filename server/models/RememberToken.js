'use strict';

var crypto = require('crypto');

var mongoose = require('mongoose');
var Types = mongoose.Schema.Types;

var RememberTokenSchema = mongoose.Schema({
  token: {
    type: String,
    required: true
  },

  user: {
    type: Types.ObjectId,
    ref: 'user',
    required: true
  }

}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

RememberTokenSchema.statics.generate = function generate(userId, done) {
  var _this = this;

  crypto.randomBytes(48, function(ex, buf) {
    if (ex) {
      return done(ex);
    }
    var token = buf.toString('hex');

    _this.create({token: token, user: userId}, function(err) {
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
