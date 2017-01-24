module.exports = {
  tags: ['Welcome'],
  idfield: 'user',
  from: 'Our Site <noreply@oursite.com>',
  subject: 'Welcome to Our Site',
  mergeVars: function(opts) {
    return {
      'name': opts.user.name,
      'email': opts.user.email
    };
  },
  individualVars: function() {
    return null;
  }
};
