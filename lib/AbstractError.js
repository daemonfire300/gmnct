// Grab the util module that's bundled with Node
var util = require('util');

// Create a new Abstract Error constructor
var AbstractError = function (msg, constr) {
  // If defined, pass the constr property to V8's
  // captureStackTrace to clean up the output
  Error.captureStackTrace(this, constr || this);

  // If defined, store a custom error message
  this.message = msg || 'Error';
};

// Extend our AbstractError from Error
util.inherits(AbstractError, Error);

// Give our Abstract error a name property. Helpful for logging the error later.
AbstractError.prototype.name = 'Abstract Error';

var ViewError = function (msg) {
  ViewError.super_.call(this, msg, this.constructor);
};

util.inherits(ViewError, AbstractError);

ViewError.prototype.name = 'View Error';

module.exports = {
  View: ViewError
};