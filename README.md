# NodeJS Template Basic

## Table of Contents:

- [Working With the Template](#working-with-the-template)
  - [System Requirements](#system-requirements)
  - [Features](#features)
  - [Style guide](#style-guide)
  - [Routes and Controllers](#routes-and-controllers)
  - [Error Handling](#error-handling)
  - [Using Mongoose](#using-mongoose)
  - [Using Datatables](#using-datatables)
  - [Using Algolia](#using-algolia)
  - [Using Image Uploads](#using-image-uploads)
  - [Using File Uploads](#using-file-uploads)
  - [Using Direct-to-Rackspace](#using-direct-to-rackspace)
- [Directory Structure](#directory-structure)
- [Default Packages](#default-packages)
- [Other packages for tasks](#other-packages-for-tasks)
- [Configuration](#configuration)
- [Other notes](#other-notes)

## Working With the Template

### System Requirements

- NodeJS 6 LTS
- MongoDB 3.x
- Yarn (an alternative to npm). Install with `npm install -g yarn`

#### Optional (suggested)

- ESLint: Helps with keeping code style and prevents a limited, yet common set of bugs through static analysis.
  Install with `npm install -g eslint`

### Features

- MVC style
- Mongoose for ORM functionality and schema enforcement
- Rackspace uploads with imagemagick integration
- Algolia integration with Mongoose models
- Emails with Mailgun
- Datatables route handler generator
- Route auto-generation for static pages
  - Able to work with new files in dev mode
- Response utilities integrated into `res`:
  - `ok`: helper to respond with JSON for ajax or rendered-view for non-ajax
  - `okRedirect`: helper to respond with JSON for ajax or redirect to page for non-ajax
- Error page detection for errors to allow unique pages for specific errors or general pages for the remainder
- Pre-built User model with auto-bcrypt prior to save
- User role levels to control levels of access
- Passport for login in case other integrations are desirable (ex: Facebook, Google, LinkedIn, etc)
- Remember-Me token capability
- Forgot password token generation and login
- Pre-built user middlewares for:
  - Require logged in
  - Require logged out
  - Require user's role is at least some level
- Security:
  - Lock login attempts after a certain number of incorrect attempts
  - Login attempts are protected from timing attacks
  - CSRF attack mitigation
  - X-FRAME-OPTIONS requires same origin to prevent Clickjacking
- Command line tools for performing common tasks:
  - Inserting new data into the database using Mongoose model schemas
  - Reset the password of a user to a specific password
  - Automatically configure Rackspace for direct-to-rackspace uploads
  - Clear and resync Algolia indecies if an out-of-sync occurs

### Style guide

1. Files should be named all lowercase with dashes separating words
2. Two space indentation should be used
3. Semicolons should always be used
4. Avoid unused variables and parameters with some exceptions on functions. Use a leading `_` to ignore a parameter.
5. Use Unix style linebreaks
6. Use single quotes or backtic-quotes (templatized strings)
7. Always use curly braces
8. Use the "one true brace" style with the opening brace on the same line. The else/elseif is also same line, ex `} else {`
9. Avoid shadowing variables (redefining an identifier), except for `err` and `callback`
10. Use the strict equality `===` and `!==`, except when testing for null `(obj == null)`
12. Declare one variable per line and one variable per `var`, `const`, and `let` declaration
13. When using commas, place the comma at the end of the line. For node, final trailing comma is acceptable. For browsers, these cause issues.

### Routes and Controllers

#### Route groups
Try to group common routes together in subpaths when possible.
For example, admin related things would probably be in `/admin`

To create a new subgroup:

1. create a file in `server/routes/`, for example, `admin.js`.
2. Use the following as a base template for the route:

```js
// this first is required to set up express
const express = require('express');
const router = express.Router();
module.exports = router;

// require all controllers and middleware in
const controllers = require('../controllers/');
const middlewares = require('../middlewares/');

// some helpers
const coWrapRoute = require('../utils/co-wrap-route');
const renderStaticPage = require('../utils/render-static-page');

// add routes below
```

3. Feel free to remove any requires not needed by your routes
4. Add your subgroup to the `server/routes/index.js` file, example:

```js
exports['/admin'] = require('./admin');
```

#### Adding a route to a group

Routes themselves use Controllers for the handler. A route group may reference more than one controller
and a controller may be used by more than one route group. Controllers should be grouped by common
functionality or common data. For example, a User Controller contains handlers related to users such as
signing up, editting account information, and viewing profiles.
These functions may be used in different subgroups. There is no set standard on exactly how to separate
functionality, just use best judgement.

To add a route:

1. Add the route to the route group using express syntax
2. The URL is relative to the sub-group the routes will be mapped to.
   A route for `/` in the group `/admin` will be `/admin/`.

3. Add any middlewares desired
4. Add the handler from the controller to the route

For example:

```js
router.get('/profile/:userid', middlewares.RequireLoggedIn, controllers.UserController.showProfile);
```

Route handlers may utilize ES6 generators to make use of `yield`. ES6 is a great way to avoid direct use
of Async and Promises making the code look synchronous. If the middleware or controller use generators,
then use the `server/utils/co-wrap-route.js` utility.

For example:

```js
router.get(
  '/profile/:userid',
  coWrapRoute(middlewares.RequireLoggedInGen),
  coWrapRoute(controllers.UserController.showProfileGen)
);
```

#### Adding a controller

Controllers are simply an exported object where the keys of the object are used as route handlers.

1. Add a file with the desired name, such as `user-controller.js`
2. Export a single object containing all the handlers
3. Add the controller to the `server/controllers/index.js`

### Error Handling

All errors should be passed to next() or thrown in a generator. In most cases, the general error handler is sufficient.
In the occasion the error should be handled in a specific nature, either use a specific error-handling-middleware
for that route or handle the error directly in the middleware where the error occurs.

The general error handler will either send a message via JSON for AJAX calls or it will render an error page.
Errors can have a custom field, status, which defines which HTTP status code to use for that error.
If the status is not defined, a 500 status is assumed. A globally defined utility, `ServerErrors`, exists to help
generate errors with status defined for you. The following helper functions exist on `ServerErrors` to set specific codes:

| Error         | Status |
|---------------|:------:|
| BadRequest    |  400   |
| NotAuthorized |  401   |
| Banned        |  402   |
| Forbidden     |  403   |
| NotFound      |  404   |
| AccountLocked |  429   |
| ServerError   |  500   |

To raise one of these errors, you may either:
- call `next`, for example: `next(ServerErrors.BadRequest('My Error Message'));`
- or throw the error, for example `throw ServerErrors.BadRequest('My Error Message');`

**Important** Be sure to immediately follow a `return` statement after using `next()` or `throw`.

The first parameter to a function defined in `ServerErrors` is the message to be thrown. A second, optional parameter
to the function allows one to customize the exact view template to use when rendering an error page.
Alternatively, when using Error, `status` may be set along with `showView` to define the specific template.

When the generic error handler is rendering a page, it may use fallback pages if the specified page does not exist.
The order the error handler will try is defined by:

- The template set in `showView`, passed to `ServerErrors` second parameter, or based on the default for the `ServerErrors`
- A template based on the status code
- A template based on the status code class (ex all 400-499 fall back to 4xx and 500-599 fall back to 5xx)
- A generic template used to catch all
- Just rendering the string out

Example code: 503 with `showView` set to "errors/oops"
- errors/oops.dust
- errors/503.dust
- errors/5xx.dust
- errors/error.dust
- No template, just send the string

### Using Mongoose

The template utilizes Mongoose for working with Mongo data. Mongoose uses schemas and models to provide structure.
These models also make defining relationships, querying data, and other tasks simpler by having a defined structure.

Adding a new model and schema is simply adding a file to `server/models` and using standard Mongoose to define everything.
The file should export the final resulting model. The schema does not need to be exported as it can be retrieved by the model.

Some models can define instance and static utility functions to aid in fetching or performing tasks on the data.
Some models may also define hooks to perform actions following other actions. For example, the User model may use an pre-save
hook to bcrypt a newly set password before saving to the database. Using hooks helps ensure actions which must always occur
following another action do happen. This mitigates the possibility of a developer performing one action and forgetting to
perform the necessary actions before or after.

### Using Datatables

Datatable integration is provided through the controller: `server/controllers/datatable-controller.js`. This controller contains one
factory method, `makeHandler`, which generates a route handler for a specific model. Just pass a reference to the desired
model. Searching, pagination, sorting, and fetching only the necessary data is built in.

Example:

```js
router.get('/tabledata', controllers.DatatableController.makeHandler(require('../models/User')));
```

### Using Algolia

Please see the [Configuration](#configuration) in the optional portion on configuring Algolia.

Algolia is a 3rd party search engine that can be integrated for searching a site's data.
Algolia is an optional utility that is not required, but is included as it commonly is required.

The provided Algolia integration acts as a plugin for Mongoose schemas. The plugin adds post-save hooks to automatically
synchronize data with Algolia. The plugin allows a person to define which fields to listen for changes if not all fields are desired.
The plugin can also automatically remove entries from Algolia when a field is set.
Functions will also be added to the model to query the search index and to save or remove a data object from Algolia.

The plugin assumes each model will have a separate search index. Currently, there is no support for an index with data
collected from multiple models. This functionality may be added later if there is a need for it.

To add the plugin to the schema, use the `plugin` method and pass any desired options for the plugin:

```js
MySchema.plugin(require('../utils/schemas/algolia-methods'), {
  autoSave: true, // boolean if the auto-save post-save hook should be enabled
  includeObjectInIndex: fn, // a function to determine if a particular object should be included in Algolia
  castToObject: fn, // a function to convert an object into the exact data format to be stored in Algolia
  indexName: str, // the name of the index. with the prefixing system, this is just the 2nd half of the Algolia index name
  errorsOnNotFound: false, // boolean if the function findOneUpdateAndSync does not find an object to update
  updateIfAnyField: null, // an array of fields that when changed, will cause an automatic sync to Algolia
                          // the default null will assume any change should be sync'd to Algolia
  removeIfFieldSet: ['removed'] // an array of fields that when set to a truthy value will remove the object from Algolia
                                // when unset, the object will be added to Algolia
});
```

### Using Image Uploads

Please see the [Configuration](#configuration) in the optional portion on configuring Rackspace.

Image uploads are processed using `multer`, `gm` (imagemagick) and `pkgcloud` to upload to Rackspace.
The system will convert uploaded images to the desired format before uploading.
Configuring the uploader will allow imagemagick operations to occur on an image and store the resulting file.
An uploaded file can have multiple derivative files with different operations, such as different resizings.

Use the middleware `UploadResizedImage` to add this functionality to a route.
`UploadResizedImage` is a factory that generates a middleware using an options array. The options array
specifies which images may be uploaded, how they may be manipulated, and the resulting filenames.
For imagine manipulation, any `fn` may be a function in the package `gm` and `args` are passed to the function call.
For example:

- the image will be in the form field: `image`
- the user is uploading a file named `myfile.png`
- we would like the original, but in jpg, keeping the original file name
- we would like a 600 wide resize, then crop to 600x300, saved with a `_wall` added to the name
- we would like a 200 wide resize, then crop to 200x60, saved with a `_tile` added to the name

```js
router.post('/uploadImage', middlewares.UploadResizedImage([
  {
    field: 'image',
    isRequired: true,
    filename: (req, file) => {
      // return just the name portion of the filename of the file the user uploaded
      // alternatively, for random names that will not overlap:
      // look to use uuid's uuid.v4() or shortid's shortid.generate
      return path.parse(file.filename).name;
    },
    extention: 'jpg',
    out: {
      // keep the original with default name as well by doing this:
      '': [],
      'wall': [
        {fn: 'resize', args: [600]},
        {fn: 'crop', args: [600, 300]}
      ],
      'tile': [
        {fn: 'resize', args: [200]},
        {fn: 'crop', args: [200, 60]}
      ]
    }
  },
  // can have multiple fields as well, but only 1 image uploaded per field
]));
```

### Using File Uploads

File uploads are similar to the image uploads, but with a few differences.
The file upload's `filename` function should contain both the filename and the extension.
There is no file type conversion. There is no imagemagick to perform any manipulations.
The file simply is uploaded to Rackspace with the designated filename as is.

```js
router.post('/uploadFile', middlewares.UploadFile([
  {
    field: 'file',
    isRequired: true,
    filename: (req, file) => {
      // return the full tilename
      // alternatively, for random names that will not overlap:
      // look to use uuid's uuid.v4() or shortid's shortid.generate
      // then append the extesion to it (path.parse(file.filename).ext)
      return file.filename;
    }
  },
  // can have multiple fields as well, but only 1 file uploaded per field
]));
```

### Using Direct-to-Rackspace

Please see the [Configuration](#configuration) in the optional portion on configuring Rackspace.

Another option for file uploads is to bypass the server and upload directly to Rackspace.
This option saves the server resources, but does not permit modifying the file. In these cases,
using a service such as Imgix will allow efficient resizing and cropping per image to happen.
In the case where many users may be uploading images at any time, this may be the optimal option.

1. The Rackspace container must be configured with CORS enabled and an HMAC key.
   A provided tool will help enable these settings and generate a secure, random HMAC key.
   The tool with ask which domains will be allowed access to upload from.
   The key should then be added to the configuration.

2. The page that shows the upload will need to use the middleware `UploadDirectVarFactory` to
   generate the settings for the form. The Dust template for the form must set all the necessary
   form fields with the provided settings. The middleware accepts two parameters:
   - `redirectTo`: the path portion of the URL to redirect to after the upload is complete
   - `fileNameFactory(req)`: a function to determine the filename-prefix and path to store in Rackspace.
     The exact filename may not be known and is not sent to the `returnTo`. To get around this, one may use
     a hidden iframe to submit the form, use JS to listen to onLoad events in the iframe, and when the iframe
     navigates to the `returnTo` page, check for an error. If no error occurred, then the full filename is:
     the result of the `fileNameFactory(req)` + the filename in the file-input field (fetchable with JS).

## Directory Structure

```
/ (project root)
├── client/ (if using webpack or similar client-side build tool)
├─┬ config/
│ ├── config.json
│ └── local.json
├── mockups/
├─┬ public/
│ ├── css/
│ ├── images/
│ └── js/
├─┬ server/
│ ├── controllers/
│ ├── emails/
│ ├── errors/
│ ├── middleware/
│ ├── models/
│ ├── responses/
│ ├── routes/
│ ├── services/
│ ├─┬ utils/
│ │ └── schemas/
│ ├─┬ views/
│ │ └── static/
│ └── index.js
├── working/
├── .gitignore
├── .slugignore
├── .s2iignore
├── app.js
├── express-server.js
├── newrelic.js
└── package.json
```

### /mockups/ and /working/

These directories are used to house any PSDs and other assets in progress.

### /client/

If using a client-side build tool such as `webpack`, use the `/client/` directory to store all the client-side
JavaScript. The resulting output of `webpack` would be in `/server/assets/js/`.

### /public/

This directory stores the public served static assets such as css, images, and JS. If using webpack,
the resulting output from webpack would live in the `/public/js/` directory. The source of the JS
would be in `/client/`.

### /config/

See the section [Configuration](#configuration).

### /server/controllers/

Controllers handle much of the logic of the application and also contain the Route handlers.
Generally, split the Controllers by purpose or data types.

See [Routes and Controllers](#routes-and-controllers) for more information.

### /server/emails/

The email folder is used to store the configuration and dust template files for each email that could be sent.
An email type must contain both files: a JS file which exports an object containing the configuration for that email,
and a dust file defining the template to be displayed to the end user. For mass-sent emails that need individual variables,
Mailgun supports per-recipient variables. Expose the variable in the configuration using `individualVars`, and then
use the format `%recipient.VARIABLE%` where `VARIABLE` is the name of the variable exposed. All variables shared between
all recipients can skip the Mailgun template variables and use Dust directly. These variables are exposed with `mergeVars`.

Each email can define who the from address is. This can either be a function which returns the from address or a string.
Each email can define who the to addresses are. This field is an array and can either contain a string of each email or
an object such as `{name: "Person's name", email: "email@address.domain"}`.
Finally, the email configuration must define a subject, which may be a function or a string.

Each of the functions defined for `from`, `subject`, `individualVars`, and `mergeVars` take only one parameter
which contains all options passed into the call to `sendTemplateEmail`.

Sending an email uses `utils/emailService.js` and the function `sendTemplateEmail`.

### /server/middleware/

Middleware defines logic to run before a route handler, such as verifying a user is logged in or fetching
extra information prior to handling a route. The extra information could be shared among multiple routes
and makes it simpler to pull in one place instead of remembering to include in each route.

### /server/models/

The template uses Mongoose for connecting to Mongo DB. Mongoose uses Models to define the schema and any utility functions.
Mongoose also has hook capability to perform actions before other actions, such as bcrypting a password before saving.
All models should be in this location. Models are not auto-loaded, so they must be required individually by any file
which may use them.

### /server/responses/

Responses are utilities that handle differences between XHR and standard HTTP requests. They also make it
easier to display error pages.

### /server/routes/

`index.js` exports various parts.
The key of the export will be the sub-path that an imported router will attach to.
The value should be an imported router from another file.
Only one path may be '/' and others should use sub-paths for clarity.

Additional files create an Express-Router to handle subpaths. The routes themselves will be defined in these files.
The route handlers should reference a library, a middleware, or a function defined within the controllers directory.

See [Routes and Controllers](#routes-and-controllers) for more information.

### /server/services/

Services are different utilities that are not handlers for routes, but are utilities controllers and other areas
may utilize to perform functions. Example services include rackspace, email, and passport.

### /server/utils/

Utils is used for utilities shared between various controllers and/or other subsystems. This could include
handy functions, data fetchers, external API handlers, and more.

#### /server/utils/co-wrap-route.js

A utility function for using ES6 generators as an Express handler. Automatically calls next with any errors.
This utility allows the use of `yield` and `yield*` within `function*(req, req)` or `function*(err, req, req)`.

`coWrapRoute(genFn, continueAfter)`

- `genFn` is the generator function to be executed. If the generator takes 2 parameters, it is considered as
  not an error handler. The two parameters are `req` and `res`. If the generator takes 3 (or more) parameters,
  it is considered an error handler. The three parameters passed are `err`, `req`, and `res`. Following the
  end of the function, `next()` will be called. If no handler causes anything to be sent, the 404 page will
  be displayed to the end user.

#### /server/utils/render-page.js

A utility function to create an Express route handler for rendering a page with a static set of locals.
The page to be rendered also will have access to any res.locals or app.locals set prior to the render call.

### /server/views/

Where all the dustjs templates are. Use subfolders to organize views by purpose (layout, sidebar, user, etc)

### /server/views/errors/

Various templates to show for error pages. The error handler attempts to load the error page for the status and if
that page does not exist, uses fallbacks. The following example is the order in which the system looks for pages:

See above section on [Error Handling](#error-handling)

Each error page template has the following variables exposed:
- `status`: The status code of the error (defaults to 500 if the error had no status code)
- `defaultMessage`: The standard HTTP error message for that code
- `message`: The custom message set or the standard message if no custom message was set
- `error`: The error object that was caught by the error handler

### /server/views/static/

A special directory for static pages that can be served without creating express routes.
The static pages are allowed to include layouts or partials. The only limitation is they do not access database.
They may, however, access the current user, CSRF token, and other variables that are exposed to all routes.

### /server/routes.js

Defines all the routes and maps to middleware and handlers. A short example is included in this repo.

### /server/server.js

Sets up configuration, creates the express app, connects to any DBs, configures all plugins, and loads routes.

### /.gitignore /.slugignore /.s2iignore

Defines the items to exclude from git, slug (Heroku) and s2i (OpenShift).

### /package.json

The standard Node project package.json. The included one is empty to show file structure. Use `npm init` to
begin configuring and `npm install --save package` to save packages to package.json

## Default Packages

### express

`express` is our default web server. As of version 4, much of the functionality
has been split into separate modules. The following are the standard list of modules used:

* `body-parser`: required to parse a POST body
* `compression`: used to gzip responses
* `connect-flash`: used for "flash" messages. Saving information between POST->redirect flows for example.
* `consolidate`: used to render templates
* `cookie-parser`: required to parse cookies.
* `express-session`: required for sessions
  * `connect-mongo` or `connect-redis` optional session-stores. `express-session` uses memory which only works
     for one dyno. Use the optional session stores to allow scaling (multiple dyno support).

### bcrypt

`bcrypt` is used for protecting user passwords. In general, use the version of `bcrypt` that supports the
version of NodeJS in use. `bcrypt` is a native module and requires the following to compile:

* Visual Studio 2012 or newer (2015 may have issues, as of writing) for Windows
  * GCC for Linux or OSX
* Python 2.7

While the `bcrypt-nodejs` package looks desirable as it does not require native compilation, the native
code is more performant, updated more often, and is in use by more projects.

### dustjs-linkedin and dustjs-helpers

The LinkedIn fork of DustJS is our default template system. In order to simplify rendering of templates,
`consolidate` is used to handle the caching, rendering, and `express` bindings. For client side requirements,
please use the same version of dustjs on the client side.

### winston

`winston` is a useful logging tool with various levels. Many plugins such as `express-winston` for logging and
more exist for logging directly to an external service. Generally, a drain is attached to the Heroku app
to send console logs automatically to the external service.


## Other packages for tasks

* `async`: highly recommended for async code, though Promises+Bluebird may be used without `async`.
* `axios`: library for making POST and GET requests with Promise returns.
* `bluebird`: if using Promises, Bluebird is a top promise implementation. Better than the native Promises.
* `csurf`: useful security tool for CSRF protection and others. Mostly we just use the CSRF part.
* `moment`: date and timezone handling library
* `mongoose`: Mongo ORM
* `multer`: file upload processing for `express`
* `newrelic`: the newrelic agent for monitoring production code
* `passport`: authentication helpers for `express` along with `passport-local`, `passport-remember-me`,
  `passport-facebook`, and many more.
* `pkgcloud`: utility for managing files in Rackspace Cloud Files
* `pluralize`: utility to aid in pluralizing words and phrases
* `validator`: utility with standard validators for many common situations such as isEmail, isZip, and more
* `webpack`: client-side build tool to enable CommonJS syntax, concat, and minification of source

## Configuration

The template uses `nconf` for configuration. Configuration settings may be set in the following ways:
- ENV variables
  Generally, ENV variables are used with Heroku and Openshift to define values that otherwise
  would be defined in the config/local.json file.

- config/local.json
  This file should NEVER be included into the git repo. This may include API keys, passwords, and other
  sensitive material that should stay out of repos. Legacy private projects may contain such material,
  but all projects moving forward should follow this best practice.

- config/config.json
  This can be in the git repo and defines a set of non-sensitive configuration settings that all users
  will share. For example, the `maxFailTries` and `maxLockTime` fit in this category. This file is
  not required as these settings can be defined in the defaults section in the code instead.

The configuration settings are loaded from ENV first, then local.json, and last config.json.
No settings are overridden, so a value in ENV takes higher priority over any JSON files and the
settings in local.json take higher priority over config.json. Thus, if you need to run your instance
with special values separate from the project, you may define them in your local.json config file
and not disrupt the project-wide config.json.

### Configuration keys

- `mongoConnectStr`
  The full connection string to the mongo database including the host, port, replicaset, username, password, and database name.
- `mailgunDomain`
  The domain used in the mailgun configuration. If left unset, sending emails will simply return without sending and without errors.
- `mailgunApiKey`
  The API key for accessing mailgun. If left unset, sending emails will simply return without sending and without errors.
- `siteDomain`
  The domain of the site, used in emails sent out, but can be used in other places with redirects.
- `logLevel`
  The log level to output and store. Defaults to `debug`.
- `port`
  The port to run on. Defaults to `3000`. Heroku and Openshift will have this set for you.
- `maxFailTries`
  The maximum number of failed login attempts before locking an account. Defaults to `3`.
- `maxLockTime`
  The maximum length of time an account may be locked out. Defaults to `1 hour`.
- `requireHTTPS`
  Set to true if the site should require HTTPS. Defaults to `false`.
- `sessionSecret`
  The secret to use to sign the session cookie.
- `redirectOn401`
  The page to redirect to when a 401 (not authenticated) occurs and the request was not JSON. Defaults to `/login`.

Other configuration for optional modules:
- noCaptcha:
  - `nocaptchaSecret`
    The secret, or API key, to use with nocaptcha validation. If not set, the captcha will be bypassed (always pass).
  - `nocaptchaBypass`
    True or false (boolean) to bypass the captcha. Useful for local environments without the need for captcha during testing.
- Rackspace:
  - `rackspaceContainer`
     Required for any rackspace capability. This is the name of the container containing all the files.
  - `rackspaceUsername`
     Required for any rackspace capability. This is the username to log into Rackspace.
  - `rackspaceApiKey`
     Required for any rackspace capability. This is the API Key required to authenticate with Rackspace instead of using a password.
  - `rackspaceMosso`
     Required for the direct-to-rackspace uploads. Each account has a URL with a folder that starts with "Mosso"
  - `rackspaceHmacKey`
     Required for the direct-to-rackspace uploads. The HMAC key is set on Rackspace for securing direct file uploads.
- Algolia
  - `algoliaAppId`
    The ID of the app in Algolia containing all the indecies.
  - `algoliaApiKey`
    The read+write API key used on the server side. This should not be exposed to the client side.
  - `algoliaIndexPrefix`
    All indecies should be named with the prefix, followed by underscore, followed by the name of the data model.
    The prefix allows for multiple instances (dev, staging, prod, per-user etc) to share an app ID and not conflict.
    Algolia does not have a naming standard, but this is what we have come up with and decided to follow.


Heroku/Production (ENV variable) Only:
- `NEW_RELIC_APP_NAME`
- `NEW_RELIC_LICENSE_KEY`

These should not be set on the developer machine, only production.
Developer machines may see the error:
```
New Relic for Node.js halted startup due to an error:
Error: Not starting without license key!
```
This is expected as only the production code should contain the license key.
Newrelic should not initialize causing this error message if the license key is not defined,
but in the event a developer machine sees it, this is ok.

However, the above is an error if seen on a production system.

## Other notes

Due to `npm shrinkwrap` having issues with some 3.x versions, we have opted to make use of the `yarn` package manager.
Please use `yarn` and commit the `yarn.lock` file to maintain versions between developers and production.
While --save-exact may seem like an answer, it does not prevent a dependency from installing an incorrect dependency.
`yarn.lock` prevents issues where production or another developer have different versions of a dependency
(or dependency of a dependency). `yarn.lock` will also generate a verification hash of the package as a security benefit
in case a malicious script overwrites a build on NPM.
