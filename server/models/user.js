'use strict';

// order matters, so superadmin has all admin rights
const UserRoles = [
  'banned',
  'inmoderation',
  'user',
  'moderator',
  'admin',
  'superadmin'
];
const defaultUserRole = 'user';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = mongoose.Schema({
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
    enum: UserRoles,
    default: defaultUserRole,
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

  // uncomment if using single signon from these providers
  // facebookId: {
  //   type: String
  // },
  // googleId: {
  //   type: String
  // },
  // twitterId: {
  //   type: String
  // },
  // linkedinId: {
  //   type: String
  // },
  // Add more to the user

}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
  timestamps: true
});


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
  const userRoleIndex = UserRoles.indexOf(this.role);
  const desiredRoleIndex = UserRoles.indexOf(minimumRole);

  return userRoleIndex >= desiredRoleIndex;
};

module.exports = mongoose.model('user', UserSchema);
