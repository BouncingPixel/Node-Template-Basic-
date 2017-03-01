'use strict';

const mongoose = require('mongoose');
const Types = mongoose.Schema.Types;

module.exports = mongoose.Schema({
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
  },
  timestamps: true
});
