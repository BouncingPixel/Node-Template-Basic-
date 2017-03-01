'use strict';

const mongoose = require('mongoose');

const LoginLockerSchema = require('../../schemas/login-locker');

module.exports = mongoose.model('loginlocker', LoginLockerSchema);
