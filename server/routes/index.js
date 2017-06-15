// require any controllers and middleware in
const FooController = require('../controllers/foo-controller');
// const UploadResizedImage = require('@bouncingpixel/rackspace-uploads').middleware.uploadResizedImage;

// these are all just example routes
module.exports = {
  '/withco': {
    get: FooController.withco // coroutines and async both work
  },

  // an example of a file upload
  // '/uploadImage': {
  //   post: {
  //     before: [
  //       UploadResizedImage([
  //         {
  //           field: 'image',
  //           isRequired: true,
  //           filename: (req, file) => {
  //             // return just the name portion of the filename of the file the user uploaded
  //             // alternatively, for random names that will not overlap:
  //             // look to use uuid's uuid.v4() or shortid's shortid.generate
  //             return path.parse(file.filename).name;
  //           },
  //           mimetypes: ['image/jpeg', 'image/png'],
  //           allowConversions: ['image/bmp'],
  //           out: {
  //             // keep the original with default name as well by doing this:
  //             '': [],
  //             'wall': [
  //               {fn: 'resize', args: [600]},
  //               {fn: 'crop', args: [600, 300]}
  //             ],
  //             'tile': [
  //               {fn: 'resize', args: [200]},
  //               {fn: 'crop', args: [200, 60]}
  //             ]
  //           }
  //         },
  //         // can have multiple fields as well, but only 1 image per field
  //       ])
  //     ],

  //     handler: SomeController.afterUpload
  //   }
  // }
};
