module.exports = {
  from: 'Our Site <noreply@oursite.com>',
  subject: 'Our Site Password Reset',
  dustVars: function(opts) {
    return {
      'name': opts.user.name,
      'email': encodeURIComponent(opts.user.email),
      'token': opts.user.token
    };
  },
  individualVars: function() {
    return null;
  }
};
