module.exports = {
  tags: ['Contact-Us'],
  from: 'Our Site <noreply@oursite.com>',
  to: ['whogetsit@oursite.com'],
  subject: function(opts) {
    return 'Contact Inquiry from ' + opts.info.name;
  },
  mergeVars: function(opts) {
    return opts.info;
  },
  individualVars: function() {
    return null;
  }
};
