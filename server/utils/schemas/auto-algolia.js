'use strict';

module.exports = function AutoAlgolia(schema, initOptions) {
  const algoliaFunctions = initOptions ? initOptions.algoliaFunctions : null;
  const errorsOnNotFound = initOptions ? initOptions.errorsOnNotFound : false;
  const updateIfAnyField = initOptions ? initOptions.updateIfAnyField : null;
  const removeIfFieldSet = initOptions && initOptions.removeIfFieldSet !== null ? initOptions.removeIfFieldSet : ['removed'];

  const updateFieldsCount = updateIfAnyField ? updateIfAnyField.length : 0;
  const removeFieldsCount = removeIfFieldSet ? removeIfFieldSet.length : 0;

  function determineAndPerform(item, shouldRemove, shouldUpdate, next) {
    if (algoliaFunctions) {
      if (shouldRemove) {
        return algoliaFunctions.remove(item, next);
      } else if (shouldUpdate) {
        return algoliaFunctions.update(item, next);
      }
    }

    return next();
  }

  schema.statics.findOneAndSave = function findOneAndSave(query, updater, options, done) {
    if (!done && options instanceof Function) {
      done = options;
      options = {new: true};
    }

    let shouldRemove = false;
    let shouldUpdate = !updateIfAnyField;

    // doc protection! prevent wiping a document out by forgetting a $set
    for (let prop in updater) {
      if (prop[0] !== '$') {
        if (removeIfFieldSet.indexOf(prop) !== -1) {
          shouldRemove = shouldRemove || updater[prop];
          shouldUpdate = shouldUpdate || !updater[prop];
        }
        if (updateIfAnyField.indexOf(prop) !== -1) {
          shouldUpdate = true;
        }

        updater.$set[prop] = updater[prop];
        delete updater[prop];
      } else if (prop === '$set' || prop === '$inc') {
        const fieldVals = updater[prop];
        for (let p in fieldVals) {
          if (removeIfFieldSet.indexOf(p) !== -1) {
            shouldRemove = shouldRemove || fieldVals[p];
            shouldUpdate = shouldUpdate || !fieldVals[p];
          }
          if (updateIfAnyField.indexOf(p) !== -1) {
            shouldUpdate = true;
          }
        }
      }
    }

    options.new = true;
    this.findOneAndUpdate(query, updater, options, function(err, item) {
      if (err) {
        return done(err);
      }

      if (item) {
        return determineAndPerform(item, shouldRemove, shouldUpdate, function() {
          done(null, item);
        });
      } else if (errorsOnNotFound) {
        return done(ServerErrors.NotFound('The item was not found.'));
      }

      return done();
    });
  };

  if (algoliaFunctions) {
    schema.pre('save', function(next) {
      const item = this;

      let shouldRemove = false;
      let shouldUpdate = !updateIfAnyField;

      let i = 0;
      for (i = 0; i < removeFieldsCount; i++) {
        if (item.isModified(removeIfFieldSet[i])) {
          shouldRemove = shouldRemove || item[removeIfFieldSet[i]];
          // even if one field states to remove, this is ok
          shouldUpdate = shouldUpdate || !item[removeIfFieldSet[i]];
        }
      }
      for (i = 0; i < updateFieldsCount; i++) {
        if (item.isModified(updateIfAnyField[i])) {
          shouldUpdate = true;
          break;
        }
      }

      determineAndPerform(item, shouldRemove, shouldUpdate, next);
    });

    schema.pre('remove', function(next) {
      const item = this;
      algoliaFunctions.remove(item, next);
    });
  }
};
