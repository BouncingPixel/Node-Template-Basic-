'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Types = mongoose.Schema.Types;

var UserSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['banned', 'inmoderation', 'user', 'moderator', 'admin', 'superadmin'],
    default: 'user', // set your default here
  },

  password: {
    type: String,
    required: true,
    minlength: [6, 'Passwords must be at least 6 characters']
  },

  logintoken: {
    type: String
  },
  tokenexpire: {
    type: Date
  },

  // Add more to the user

}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

UserSchema.plugin(require('../utils/SchemaTimestamps'), {createdAtIndex: true});

UserSchema.pre('save', function(next) {
  var user = this;

  // make sure email is lowercase
  if (user.isModified('email')) {
    user.email = user.email.toLowerCase();
  }

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) {
      return next(err);
    }

    user.password = hash;
    next();
  });
});

module.exports = mongoose.model('user', UserSchema);
