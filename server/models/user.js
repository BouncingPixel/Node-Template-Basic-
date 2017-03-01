'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = require('../../schemas/user');

// pre-hook makes sure the user's password is always hashed
UserSchema.pre('save', function(next) {
  let user = this;

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

UserSchema.methods.isRoleAtLeast = function(minimumRole) {
  const UserRoles = this.model('user').schema.path('role').enumValues;

  const userRoleIndex = UserRoles.indexOf(this.role);
  const desiredRoleIndex = UserRoles.indexOf(minimumRole);

  return userRoleIndex >= desiredRoleIndex;
};

module.exports = mongoose.model('user', UserSchema);
