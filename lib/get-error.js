const { replace } = require('lodash');
const SemanticReleaseError = require('@semantic-release/error');
const ERROR_DEFINITIONS = require('./definitions/errors');
const ERROR_DEFINITIONS_BASE = require('@semantic-release/github/lib/definitions/errors');
const pkgBase = require('@semantic-release/github/package.json');
const [homepageBase] = pkgBase.homepage.split('#');
const pkg = require('../package.json');
const [homepage] = pkg.homepage.split('#');

module.exports = (code, ctx = {}) => {
  let error;
  if (ERROR_DEFINITIONS[code] !== undefined) {
    error = ERROR_DEFINITIONS[code](ctx);
  } else {
    error = ERROR_DEFINITIONS_BASE[code](ctx);
    error.details = replace(error.details, `${homepageBase}/blob/master/`, `${homepage}/blob/main/`);
  }
  const { message, details } = error;
  return new SemanticReleaseError(message, code, details);
};
