'use strict';

const multer = require('multer');
const csrf = require('csurf');
const mime = require('mime');
const async = require('async');
const bluebird = require('bluebird');
const path = require('path');
const fs = require('fs');
const fsunlink = bluebird.promisify(fs.unlink);

const gm = require('gm');
const imageMagick = gm.subClass({ imageMagick: true });

const tmpPath = path.resolve(__dirname, '../../../tmp/');

const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, tmpPath);
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
//              receives 2 parameters: req and the uploaded filename. returns filename excluding extension
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

  const uploader = uploaderFactory.fields(fields.map(function(item) {
    return { name: item.field, maxCount: 1 };
  }));

   // these are inside here, because we need the closure to contain fields
   // otherwise, we would use a factory that wraps with a closure anyway
  function afterMulter(req, res, next) {
    Promise.all(fields.map(function(fieldInfo) {
      const fieldName = fieldInfo.field;

      if (!req.files[fieldName] || req.files[fieldName].length !== 1 || req.files[fieldName][0].size <= 0) {
        if (fieldInfo.isRequired) {
          return Promise.reject(ServerErrors.BadRequest(`The file for ${fieldName} is missing`));
        }
      }

      return Promise.resolve();
    })).then(function() {
      return Promise.all(fields.map(function(fieldInfo) {

        const fieldName = fieldInfo.field;
        const fieldOutputs = Object.keys(fieldInfo.out);

        if (!req.files[fieldName] || req.files[fieldName].length !== 1 || req.files[fieldName][0].size <= 0) {
          // just ignore it since it must be optional to get here
          return Promise.resolve();
        }

        const tmpFileName = req.files[fieldName][0].filename;
        const filename = fieldInfo.filename(req, tmpFileName);
        const extension = fieldInfo.extension;

        if (!req.uploads) {
          req.uploads = {};
        }
        req.uploads[fieldName] = {};

        return Promise.all(fieldOutputs.map(function(key) {
          const newFileName = key.length ? `${filename}_${key}.${extension}` : `${filename}.${extension}`;
          req.uploads[fieldName][key] = newFileName;
          return performActionsAndUpload(tmpFileName, newFileName, extension, fieldInfo.out[key]);
        }));
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

      if (!req.files[fieldName] || req.files[fieldName].length !== 1 || req.files[fieldName][0].size <= 0) {
        // if there is no file to remove, then we don't try
        return Promise.resolve();
      }

      const tmpFileName = req.files[fieldName][0].filename;

      return fsunlink(path.resolve(tmpPath, tmpFileName));
    })).then(function() {
      next(err);
    }).catch(function(internalError) {
      next(internalError);
    });
  }

  // to abstract multer away, doing this to "inject" multer into the middleware stack
  return function(req, res, next) {
    async.series([
      function(cb) {
        uploader(req, res, cb);
      },
      function(cb) {
        csrf({cookie: true})(req, res, cb);
      },
      function(cb) {
        afterMulter(req, res, cb);
      }
    ], function(err) {
      next(err);
    });
  };
};

function performActionsAndUpload(tmpFileName, newFileName, extension, operations) {
  const mimetype = mime.lookup(extension);

  return new Promise((resolve, reject) => {
    const imgToStream = operations.reduce(function(img, operation) {
      return img[operation.fn].apply(img, operation.args);
    }, imageMagick(path.resolve(tmpPath, tmpFileName)));

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
