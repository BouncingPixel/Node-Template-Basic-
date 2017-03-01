const Document = require('mongoose/lib/browserDocument');

Document.emit = function() {};

// validates all fields in a data object against a schema using mongoose
function validateAll(data, Schema) {
  return new Promise((resolve, reject) => {
    const doc = new Document(data, Schema);

    doc.validate((err) => {
      if (err) {
        reject(err);
        return;
      } else {
        resolve();
        return;
      }
    });
  });
}

// validates a single field agaisnt the mongoose schema
// Does require all data (due to mongoose)
// the dataPath is in dot-notation, including arrays. ex: lines.0.qty
function validateField(allData, dataPath, Schema) {
  return new Promise((resolve, reject) => {
    const doc = new Document(allData, Schema);
    const p = Schema.path(dataPath);
    // do it this way, so any necessary casting occurs
    const value = doc.get(dataPath);

    p.doValidate(value, function(err) {
      if (err) {
        reject(err);
        return;
      } else {
        resolve();
        return;
      }
    }, doc);
  });
}

module.exports = {
  validateAll: validateAll,
  validateField: validateField
};
