'use strict';

// controllers need to include models this way to avoid errors
const User = require('../models/user');

module.exports = {
  index: function(req, res) {
    res.render('layouts/main');
  },

  withco: function*(req, res) {
    const someUser = yield User.findOne({});

    res.render('layouts/main', {someUser: someUser});
  }

};
