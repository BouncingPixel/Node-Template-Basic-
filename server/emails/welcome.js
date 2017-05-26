module.exports = {
  from: 'Our Site <noreply@oursite.com>',
  subject: 'Welcome to Our Site',
  dustVars: function(opts) {
    return {
      'name': opts.user.name,
      'email': opts.user.email
    };
  },
  individualVars: function() {
    return null;
  }
};
