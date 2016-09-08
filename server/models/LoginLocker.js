'use strict';

var mongoose = require('mongoose');
var Types = mongoose.Schema.Types;

var LoginLockerSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },

  failedCount: {
    type: Number,
    default: 0
  },

  lockedUntil: {
    type: Date
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('loginlocker', LoginLockerSchema);
