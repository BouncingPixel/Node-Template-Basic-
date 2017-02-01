'use strict';

// const User = require('../models/User');

module.exports = {
  index: function(req, res) {
    res.render('main');
  },

  withco: function*(req, res) {
    // const someUser = yield User.findOne({});

    res.render('main', {someUser: someUser});
  }

};
