module.exports = {
  tags: ['Forgot-Password'],
  idfield: 'user',
  from: 'Our Site <noreply@oursite.com>',
  subject: 'Our Site Password Reset',
  mergeVars: function(opts) {
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
