# NodeJS Template Basic

## Table of Contents:

- [Working With the Template](#working-with-the-template)
  - [System Requirements](#system-requirements)
  - [Features](#features)
  - [Style guide](#style-guide)
  - [Routes and Controllers](#routes-and-controllers)
  - [Error Handling](#error-handling)
- [Directory Structure](#directory-structure)
- [Default Packages](#default-packages)
- [Other packages for tasks](#other-packages-for-tasks)
- [Optional Utility Packages](#optional-utility-packages)
- [Configuration](#configuration)
- [Other notes](#other-notes)

## Working With the Template

### System Requirements

- NodeJS 6 LTS
- Yarn (an alternative to npm). See https://yarnpkg.com/docs/install
- Webpack. Install with `npm install -g webpack`
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
  - File uploads
- Single sign on capability pre-built for:
  - Facebook
  - Google
  - Twitter
  - LinkedIn
- Security:
  - Lock login attempts after a certain number of incorrect attempts
  - Login attempts are protected from timing attacks
  - CSRF attack mitigation
  - X-FRAME-OPTIONS requires same origin to prevent Clickjacking
  - Capability to redirect to HTTPS
  - HSTS header when require-HTTPS is enabled
  - Capability to redirect to required domain
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
of Async and Promises making the code look synchronous. If the controller uses generators,
then use the `server/utils/co-wrap-route.js` utility.
The utility does not work for middleware.

For example:

```js
router.get(
  '/profile/:userid',
  middlewares.RequireLoggedIn,
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
If the status is not defined, a 500 status is assumed. A helper package, `@bouncingpixel/http-errors`, exists to help
generate errors with status defined for you. The following Error classes exist in `@bouncingpixel/http-errors` to set specific codes:

| Error                 | Status |
|-----------------------|:------:|
| BadRequestError       |  400   |
| NotAuthorizedError    |  401   |
| BannedError           |  402   |
| ForbiddenError        |  403   |
| NotFoundError         |  404   |
| AccountLockedError    |  429   |
| InternalServerError   |  500   |

To raise one of these errors, first require in the `@bouncingpixel/http-errors` package, then just use like any other Error
- call `next`, for example: `next(new HttpErrors.BadRequestError('My Error Message'));`
- or throw the error, for example `throw new HttpErrors.BadRequestError('My Error Message');`
- or use in a callback, for example `done(new HttpErrors.BadRequestError('My Error Message'));`
- or any other use of an Error object

**Important** Be sure to immediately follow a `next()` call with a `return` statement to prevent further processing.

See [Http-Errors](https://github.com/BouncingPixel/node-packages/tree/master/http-errors).

Alternatively, when using Error, `status` may be set along with `showView` to define the specific template.

When the generic error handler is rendering a page, it may use fallback pages if the specified page does not exist.
The order the error handler will try is defined by:

- The template set in `showView` if set on the Error object
- Templates within any subdirectories up to the root views directory for:
  - A template based on the status code
  - A template based on the status code class (ex all 400-499 fall back to 4xx and 500-599 fall back to 5xx)
  - A generic template used to catch all
- Just rendering the string out

Example code: 503 with `showView` set to "errors/oops" with the URL "blog/this-is-a-post"
- errors/oops.dust
- blog/errors/503.dust
- blog/errors/5xx.dust
- blog/errors/error.dust
- errors/503.dust
- errors/5xx.dust
- errors/error.dust
- No template, just send the string

### Using A Database

A database is optional. Many applications will use `mongoose` and thus use `@bouncingpixel/mongoose-db`.

If using `mongoose`, place the Schemas in `schema` directory.
Mongoose schemas are supported in the browser and can be used by `@bouncingpixel/pixel-validate`.

If using an ORM, models should go in the `server/models` directory.

Some models can define instance and static utility functions to aid in fetching or performing tasks on the data.
Some models may also define hooks to perform actions following other actions. For example, the User model may use an pre-save
hook to bcrypt a newly set password before saving to the database. Using hooks helps ensure actions which must always occur
following another action do happen. This mitigates the possibility of a developer performing one action and forgetting to
perform the necessary actions before or after.

## Directory Structure

```
/ (project root)
├─┬ client/
│ ├── admin.js
│ └── main.js
├─┬ config/
│ ├── config.json
│ └── local.json
├── mockups/
├─┬ public/
│ ├── css/
│ ├── images/
│ └── js/
├── schemas/
├─┬ server/
│ ├── controllers/
│ ├── emails/
│ ├── errors/
│ ├── middleware/
│ ├── models/
│ ├── responses/
│ ├── routes/
│ ├── services/
│ ├── utils/
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

### /schemas/

Contains any schemas for ORM models. They are placed here, so they may be used by client and server side.

### /server/controllers/

Controllers handle much of the logic of the application and also contain the Route handlers.
Generally, split the Controllers by purpose or data types.

See [Routes and Controllers](#routes-and-controllers) for more information.

### /server/emails/

See [mailgun-emails](https://github.com/BouncingPixel/node-packages/tree/master/mailgun-emails).

### /server/middleware/

Middleware defines logic to run before a route handler, such as verifying a user is logged in or fetching
extra information prior to handling a route. The extra information could be shared among multiple routes
and makes it simpler to pull in one place instead of remembering to include in each route.

### /server/models/

The template uses Mongoose for connecting to Mongo DB. Mongoose uses Models to define the schema and any utility functions.
Mongoose also has hook capability to perform actions before other actions, such as bcrypting a password before saving.
All models should be in this location. Models are not auto-loaded, so they must be required individually by any file
which may use them.

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
may utilize to perform functions.

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

### /server/server.js

Sets up configuration, creates the express app, connects to any DBs, configures all plugins, and loads routes.

### /.gitignore /.slugignore /.s2iignore

Defines the items to exclude from git, slug (Heroku) and s2i (OpenShift).

### /package.json

The standard Node project package.json. The included one is empty to show file structure. Use `npm init` to
begin configuring and `npm install --save package` to save packages to package.json

## Default Packages

* `@bouncingpixel/error-router`: Utility for handling errors and routing to pages
* `@bouncingpixel/universal-response`: Utility for universal (XHR vs non-XHR) requests
* `@bouncingpixel/auto-static-routes`: Utility for automatically creating routes for static pages
* `@bouncingpixel/http-errors`: Error classes for various HTTP status codes

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

## Optional Utility Packages

* `@bouncingpixel/algolia`: Mongoose schema plugin and other utilities for Algolia
* `@bouncingpixel/datatable-routes`: Route handler for Datatables
* `@bouncingpixel/mailgun-emails`: Emailer using mailgun and Dust templates
* `@bouncingpixel/mongoose-db`: Mongoose database adapter with a passport-impl for the passport-auth
* `@bouncingpixel/nocaptcha-middleware`: Middleware to validate a nocaptcha response
* `@bouncingpixel/passport-auth`: User authentication with passport, relies on email as username
* `@bouncingpixel/pixel-validate`: A tool for using Mongoose schemas to validate on server and in browser
* `@bouncingpixel/rackspace-uploads`: Express middlewares to aid in uploading files to rackspace

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

The key "client" should be an object. This key will also be exported to the client side and accessible
from the server side. For example, algoliaSearchKey is needed by the client. This key's value can be found
in the ENV var: `client:algoliaSearchKey` or via the local.json `client.algoliaSearchKey`.
If you need to access the key on the server side, use `nconf.get('client:algoliaSearchKey')`.
If you need to access the key on the client side, make sure `/js/config.js` is loaded and access
`algoliaSearchKey` in the config. `/js/config.js` uses UMD for the most support and works with webpack.

### Configuration keys

- `siterootHost`
  The domain of the site, used in canonical URLs and emails sent out, but can be used in other places with redirects.
- `forceDomain`
  Set to true if the site should redirect to force the `domain` listed. Defaults to `false`.
- `logLevel`
  The log level to output and store. Defaults to `debug`.
- `port`
  The port to run on. Defaults to `3000`. Heroku and Openshift will have this set for you.
- `requireHTTPS`
  Set to true if the site should use HTTPS in all URLs (such as canonical). Defaults to `false`.
- `httpsRedirect`
  Set to true if the site should redirect to HTTPS. You might want false and let CloudFlare do it. Defaults to `false`.
- `sessionSecret`
  The secret to use to sign the session cookie.
- `redirectOn401`
  The page to redirect to when a 401 (not authenticated) occurs and the request was not JSON. Defaults to `/login`.

- `gatrackerid`
  The tracker ID for Google Analytics. When set, the GA code will be added to the page.
- `facebookpixelcode`
  The tracker ID for Facebook Pixel. When set, the Facebook Pixel code will be added to the page.
- `WEBTOOLS_VERIF_ID`
  The ID for Webmaster Tools verification. When set, a file will be dynamically generated to assist with Webmaster Tools verifications. Simply set this field to enable the feature.


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
