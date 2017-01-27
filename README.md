# NodeJS Template Basic

## Table of Contents:

- [Working With the Template](#working-with-the-template)
- [Directory Structure](#directory-structure)
- [Default Packages](#default-packages)
- [Other packages for tasks](#other-packages-for-tasks)
- [Configuration](#configuration)
- [Other notes](#other-notes)

## Working With the Template

### System Requirements

- NodeJS 6 LTS
- MongoDB 3.x

### Features

- MVC style
- Mongoose for ORM functionality and schema enforcement
- Rackspace uploads with imagemagick integration
- Algolia integration with Mongoose models
- Emails with Mailgun
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
  - *Coming soon* Automatically configure Rackspace for direct-to-rackspace uploads
  - *Coming soon* Clear and resync Algolia indecies if an out-of-sync occurs
  - *Coming soon* Reset the password of a user to a specific password

### Adding routes

### Returning errors

### Using Mongoose
### Using Algolia
### Using Image Uploads
### Using Direct-to-Rackspace

### Customization examples

#### No users required, client-facing only

#### Users required, admin-facing only

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

If a route handler uses async or generator, please use the util

### /server/services/

Services are different utilities that are not handlers for routes, but are utilities controllers and other areas
may utilize to perform functions. Example services include rackspace, email, and passport.

### /server/utils/

Utils is used for utilities shared between various controllers and/or other subsystems. This could include
handy functions, data fetchers, external API handlers, and more.

#### /server/utils/co-wrap-route.js
#### /server/utils/render-static-page.js


### /server/views/

Where all the dustjs templates are. Use subfolders to organize views by purpose (layout, sidebar, user, etc)

### /server/views/errors/

Various templates to show for error pages. The error handler attempts to load the error page for the status and if
that page does not exist, uses fallbacks. The following example is the order in which the system looks for pages:

Example code: 503
- errors/503.dust
- errors/5xx.dust
- errors/error.dust

All 500-599 errors fallback to 5xx.dust, 400-499 to 4xx.dust, etc. If those pages in turn do not exist, the general
error.dust page is used. If that page does not exist, the error message itself is sent.

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

Please make use of `npm shrinkwrap`. While --save-exact may seem like an answer, it does not prevent
a dependency from installing an incorrect dependency. The shrinkwrap prevents issues where production or
another developer have different versions of a dependency (or dependency of a dependency). Shrinkwrap will
also generate a verification hash of the package as a security benefit in case a malicious script overwrites
a build on NPM.
