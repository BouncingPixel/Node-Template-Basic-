'use strict';

module.exports = function(dust) {
  dust.helpers.getFileHash = function(chunk, context, bodies, params) {
    const fileHashes = context.get('fileHashes');
    const file = params.file;
    return fileHashes[file] || '';
  };
};
