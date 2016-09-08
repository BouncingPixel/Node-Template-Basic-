'use strict';

module.exports = function SchemaTimestamps(schema, options) {
  schema.add({createdAt: Date});
  schema.add({updatedAt: Date});

  if (options.createdAtIndex) {
    schema.index({createdAt: 1});
  }
  if (options.updatedAtIndex) {
    schema.index({updatedAt: 1});
  }

  schema.pre('save', function(next) {
    this.updatedAt = new Date();
    if (!this.createdAt) {
      this.createdAt = this.updatedAt;
    }
    next();
  });

  schema.pre('update', function() {
    this.update({}, {$set: {updatedAt: new Date()}});
  });

  schema.pre('findOneAndUpdate', function() {
    this.findOneAndUpdate({}, {$set: {updatedAt: new Date()}});
  });
};
