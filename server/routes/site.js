// this first is required to set up express
const express = require('express');
const router = express.Router();
module.exports = router;

// require all controllers and middleware in
const controllers = require('../controllers/');
const middlewares = require('../middlewares/');

// some helpers
const coWrapRoute = require('../utils/co-wrap-route');

// define routes below
// router.get('/', controllers.FooController.index);

// example image upload:
// form field: image
// if user uploads "myfile.png", the resulting files are:
// original size "myfile.jpg"
// 600x300 "myfile_wall.jpg"
// 200x60 "myfile_tile.jpg"
// router.post('/upload', middlewares.uploadResizedImage([
//   {
//     field: 'image',
//     isRequired: true,
//     filename: (req, file) => {
//       // return just the name portion of the filename of the file the user uploaded
//       // alternatively, for random names that will not overlap:
//       // look to use uuid's uuid.v4() or shortid's shortid.generate
//       return path.parse(file.filename).name;
//     },
//     extention: 'jpg',
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
