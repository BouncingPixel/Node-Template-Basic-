'use strict';

const multer = require('multer');
const mime = require('mime');
const bluebird = require('bluebird');
const fs = require('fs');
const fsunlink = bluebird.promisify(fs.unlink);

const gm = require('gm');
const imageMagick = gm.subClass({ imageMagick: true });

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
//    filename: the name of the file to use
//    extention: the desired final extension to use (will convert from any to desired)
//    out: object where key is a string that will be inserted into the filename (filename + key + extension)
//         the value points to an array of objects with (or an empty array to just make sure extension is correct):
//              fn: string (crop, resize, etc; functions from imageMagick)
//              args: array of args to pass into imageMagick
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
      const fieldOutputs = Object.keys(fieldInfo.out);

      if (!req[fieldName] || req[fieldName].length !== 1 || req[fieldName][0].size <= 0) {
        if (fieldInfo.isRequired) {
          return Promise.reject(ServerErrors.BadRequest(`The file for ${fieldName} is missing`));
        } else {
          // just ignore it since it is optional
          return Promise.resolve();
        }
      }

      const tmpFileName = req[fieldName][0].filename;

      return Promise.all(fieldOutputs.map(function(key) {
        return performActionsAndUpload(tmpFileName, fieldInfo.filename, fieldInfo.extension, key, fieldInfo.out[key]);
      }));
    })).then(function() {
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

function performActionsAndUpload(tmpFilePath, filename, extension, nameToAppend, operations) {
  const newFileName = `${filename}_${nameToAppend}.${extension}`;
  const mimetype = mime.lookup(extension);

  return new Promise((resolve, reject) => {
    const imgToStream = operations.reduce(function(img, operation) {
      return img[operation.fn].apply(img, operation.args);
    }, imageMagick(tmpFilePath));

    imgToStream.stream(extension, function(err, stdout, _stderr) {
      if (err) {
        reject(err);
        return;
      }

      resolve(stdout);
    });
  }).then(function(stdout) {
    return RackspaceService.uploadStreamAsync({
      filename: newFileName,
      mimeType: mimetype,
      stream: stdout
    });
  });
}
