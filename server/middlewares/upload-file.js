'use strict';

const multer = require('multer');
const mime = require('mime');
const bluebird = require('bluebird');
const fs = require('fs');
const path = require('path');
const fsunlink = bluebird.promisify(fs.unlink);

const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '../tmp');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const uploaderFactory = multer({storage: uploadStorage});

const RackspaceService = require('../services/rackspace-service');

// fields: an array of objects containing:
//    field: the name of the POST field with the file
//    isRequired: boolean to denote if the file is required (true) or optional (false)
//    filename: function to determine the name of the file to store in Rackspace
//              receives 2 parameters: req and the uploaded filename. return full file name including extension
module.exports = function(fields) {
  if (!fields || fields.length === 0) {
    return function(req, res, next) {
      next();
    };
  }

  const uploader = uploaderFactory(fields.map(function(item) {
    return { name: item.field, maxCount: 1 };
  }));

   // these are inside here, because we need the closure to contain fields
   // otherwise, we would use a factory that wraps with a closure anyway
  function afterMulter(req, res, next) {
    Promise.all(fields.map(function(fieldInfo) {
      const fieldName = fieldInfo.field;

      if (!req[fieldName] || req[fieldName].length !== 1 || req[fieldName][0].size <= 0) {
        if (fieldInfo.isRequired) {
          return Promise.reject(ServerErrors.BadRequest(`The file for ${fieldName} is missing`));
        }
      }

      return Promise.resolve();
    })).then(function() {
      return Promise.all(fields.map(function(fieldInfo) {
        const fieldName = fieldInfo.field;

        if (!req[fieldName] || req[fieldName].length !== 1 || req[fieldName][0].size <= 0) {
          // just ignore it since it must be optional to get here
          return Promise.resolve();
        }

        const tmpFileName = req[fieldName][0].filename;
        const filename = fieldInfo.filename(req, tmpFileName);

        return performActionsAndUpload(tmpFileName, filename);
      }));
    }).then(function() {
      cleanUpFiles(null, req, next);
    }).catch(function(err) {
      cleanUpFiles(err, req, next);
    });
  }

  function cleanUpFiles(err, req, next) {
    Promise.all(fields.map(function(fieldInfo) {
      const fieldName = fieldInfo.field;

      if (!req[fieldName] || req[fieldName].length !== 1 || req[fieldName][0].size <= 0) {
        // if there is no file to remove, then we don't try
        return Promise.resolve();
      }

      const tmpFileName = req[fieldName][0].filename;

      return fsunlink(tmpFileName);
    })).then(function() {
      next(err);
    }).catch(function(internalError) {
      next(internalError);
    });
  }

  // to abstract multer away, doing this to "inject" multer into the middleware stack
  return function(req, res, next) {
    uploader(req, res, function(err) {
      if (err) {
        next(err);
        return;
      }

      afterMulter(req, res, next);
    });
  };
};

function performActionsAndUpload(tmpFilePath, filename) {
  const extension = path.parse(filename).ext;
  const mimetype = mime.lookup(extension);

  return RackspaceService.uploadStreamAsync({
    filename: filename,
    mimeType: mimetype,
    stream: fs.createReadStream(tmpFilePath)
  });
}
