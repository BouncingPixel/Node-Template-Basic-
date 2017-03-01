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

module.exports = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, 'User accounts must have an email address']
  },

  name: {
    type: String,
    required: [true, 'User accounts must have a person\'s name']
  },

  role: {
    type: String,
    enum: [UserRoles, 'Only valid roles may be assigned to a user'],
    default: defaultUserRole,
  },

  password: {
    type: String,
    required: true,
    minlength: [6, 'Passwords must be at least 6 characters'],
    maxlength: [60, 'Passwords must be less than 60 characters']
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
