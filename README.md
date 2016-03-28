# NodeJS Template Basic

## Directory Structure

```
/ (project root)
├── client/ (if using webpack or similar client-side build tool)
├── mockups/
├─┬ server/
│ ├─┬ assets/
│ │ ├── css/
│ │ ├── images/
│ │ └── js/
│ ├── controllers/
│ ├── middleware/
│ ├── responses/
│ ├── utils/
│ ├── views/
│ ├── routes.js
│ └── server.js
├── working/
├── .gitignore
├── .slugignore
├── .s2iignore
└── package.json
```

### /mockups/ and /working/

These directories are used to house any PSDs and other assets in progress.

### /client/

If using a client-side build tool such as `webpack`, use the `/client/` directory to store all the client-side
JavaScript. The resulting output of `webpack` would be in `/server/assets/js/`.

### /server/assets/

This directory stores the public served static assets such as css, images, and JS. If using webpack,
the resulting output from webpack would live in the `/server/assets/js/` directory. The source of the JS
would be in `/client/`.

### /server/controllers/

Controllers handle much of the logic of the application and also contain the Route handlers.
Generally, split the Controllers by purpose or data types.

### /server/middleware/

Middleware defines logic to run before a route handler, such as verifying a user is logged in or fetching
extra information prior to handling a route. The extra information could be shared among multiple routes
and makes it simpler to pull in one place instead of remembering to include in each route.

### /server/responses/

Responses are utilities that handle differences between XHR and standard HTTP requests. They also make it
easier to display error pages.

### /server/utils/

Utils is used for utilities shared between various controllers and/or other subsystems. This could include
handy functions, data fetchers, external API handlers, and more.

### /server/views/

Where all the dustjs templates are. Use subfolders to organize views by purpose (layout, sidebar, user, etc)

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

A default package.json is not included as versions would need to be consistently bumped.

```
npm install --save bcrypt express body-parser compression connect-flash cookie-parser express-session adaro winston express-winston
```


### express

`express` is our default web server. As of version 4, much of the functionality
has been split into separate modules. The following are the standard list of modules used:

* `body-parser`: required to parse a POST body
* `compression`: used to gzip responses
* `connect-flash`: used for "flash" messages. Saving information between POST->redirect flows for example.
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

### dustjs

The LinkedIn fork of DustJS is our default template system. In order to simplify rendering of templates,
`adaro` from Paypal is used to handle the caching, rendering, and `express` bindings. `adaro` also includes
all of the `dustjs-helpers` within the installation. For client side requirements, please use the same version
of dustjs on the client side as `adaro` uses.

Alternatively, `dustjs-linkedin` may be used with `consolidate`. `consolidate` will handle the `express`
bindings and caching. `dustjs-linkedin` is a universal package which can be used server and client side.
Many existing projects use this alternative before `adaro` and this is still acceptable.

### winston

`winston` is a useful logging tool with various levels. Many plugins such as `express-winston` for logging and
more exist for logging directly to an external service. Generally, a drain is attached to the Heroku app
to send console logs automatically to the external service.


## Other packages for tasks

* `async`: highly recommended for async code, though Promises+Bluebird may be used without `async`.
* `bluebird`: if using Promises, Bluebird is a top promise implementation. Better than the native Promises.
* `lodash`: useful utility library for data manipulation
* `lusca`: useful security tool for CSRF protection and others. Mostly we just use the CSRF part.
* `moment`: date and timezone handling library
* `mongoose`: Mongo ORM
* `multer`: file upload processing for `express`
* `passport`: authentication helpers for `express` along with `passport-local`, `passport-remember-me`,
  `passport-facebook`, and many more.
* `pkgcloud`: utility for managing files in Rackspace Cloud Files
* `pluralize`: utility to aid in pluralizing words and phrases
* `validator`: utility with standard validators for many common situations such as isEmail, isZip, and more
* `webpack`: client-side build tool to enable CommonJS syntax, concat, and minification of source

## Other notes

Please make use of `npm shrinkwrap`. While --save-exact may seem like an answer, it does not prevent
a dependency from installing an incorrect dependency. The shrinkwrap prevents issues where production or
another developer have different versions of a dependency (or dependency of a dependency). Shrinkwrap will
also generate a verification hash of the package as a security benefit in case a malicious script overwrites
a build on NPM.
