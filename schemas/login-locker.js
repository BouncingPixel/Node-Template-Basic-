'use strict';

const mongoose = require('mongoose');

module.exports = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required.']
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
  },
  timestamps: true
});
