'use strict';

const mongoose = require('mongoose');
const Types = mongoose.Schema.Types;

module.exports = mongoose.Schema({
  token: {
    type: String,
    required: [true, 'Token is required.']
  },

  user: {
    type: Types.ObjectId,
    ref: 'user',
    required: [true, 'User is required.']
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
