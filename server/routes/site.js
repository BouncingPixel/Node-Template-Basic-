// this first is required to set up express
const express = require('express');
const router = express.Router();
module.exports = router;

// require any controllers and middleware in
const FooController = require('../controllers/foo-controller');

// define routes below
/* Static route
router.get('/', FooController.index); */
router.get('/withco', FooController.withco);

const oldToNewRedirects = {
  '/about': '/about-mysite',

  '/oldblogs/:slug': '/newblogs/${slug}'
};

for (const oldUrl in oldToNewRedirects) {
  const newUrl = oldToNewRedirects[oldUrl];
  const hasParams = oldUrl.indexOf('/:') !== -1;

  router.get(oldUrl, function(req, res) {
    if (!hasParams) {
      res.redirect(newUrl);
      return;
    }

    const formattedUrl = newUrl.replace(/\$\{([a-z]+)\}/g, function(match, param) {
      return req.params[param];
    });

    res.redirect(formattedUrl);
  });
}


// example image upload:
// form field: image
// if user uploads "myfile.png", the resulting files are:
// original size "myfile.jpg"
// 600x300 "myfile_wall.jpg"
// 200x60 "myfile_tile.jpg"
// const UploadResizedImage = require('@bouncingpixel/rackspace-uploads').middleware.uploadResizedImage;
// router.post('/uploadImage', UploadResizedImage([
//   {
//     field: 'image',
//     isRequired: true,
//     filename: (req, file) => {
//       // return just the name portion of the filename of the file the user uploaded
//       // alternatively, for random names that will not overlap:
//       // look to use uuid's uuid.v4() or shortid's shortid.generate
//       return path.parse(file.filename).name;
//     },
//     mimetypes: ['image/jpeg', 'image/png'],
//     allowConversions: ['image/bmp'],
//     out: {
//       // keep the original with default name as well by doing this:
//       '': [],
//       'wall': [
//         {fn: 'resize', args: [600]},
//         {fn: 'crop', args: [600, 300]}
//       ],
//       'tile': [
//         {fn: 'resize', args: [200]},
//         {fn: 'crop', args: [200, 60]}
//       ]
//     }
//   },
//   // can have multiple fields as well, but only 1 image per field
// ]));
