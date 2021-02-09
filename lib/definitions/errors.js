const { inspect } = require('util');
const { isString } = require('lodash');
const pkg = require('../../package.json');
const [homepage] = pkg.homepage.split('#');
const stringify = (object) =>
  isString(object) ? object : inspect(object, { breakLength: Number.POSITIVE_INFINITY, depth: 2, maxArrayLength: 5 });
const linkify = (file) => `${homepage}/blob/main/${file}`;

module.exports = {
  EINVALIDPULLREQUESTTITLE: ({ pullrequestTitle }) => ({
    message: 'Invalid `pullrequestTitle` option.',
    details: `The [pullrequestTitle option](${linkify(
      'README.md#pullrequestTitle'
    )}) if defined, must be a non empty \`String\`.

Your configuration for the \`pullrequestTitle\` option is \`${stringify(pullrequestTitle)}\`.`,
  }),
  EINVALIDBRANCH: ({ branch }) => ({
    message: 'Invalid `branch` option.',
    details: `The [branch option](${linkify('README.md#branch')}) if defined, must be a non empty \`String\`.

Your configuration for the \`branch\` option is \`${stringify(branch)}\`.`,
  }),
  EINVALIDBASEREF: ({ baseRef }) => ({
    message: 'Invalid `baseRef` option.',
    details: `The [baseRef option](${linkify('README.md#baseRef')}) if defined, must be a non empty \`String\`.

Your configuration for the \`baseRef\` option is \`${stringify(baseRef)}\`.`,
  }),
  EMISSINGSHA: ({ githubSha }) => ({
    message: 'Invalid Sha.',
    details: `The [GitHub sha](${linkify(
      'README.md#github-sha'
    )}) configured in the \`GH_SHA\` or \`GITHUB_SHA\` environment variable must be a valid commit sha-1.

Please make sure to set the \`GH_SHA\` or \`GITHUB_SHA\` environment variable in your CI with the exact value of the commit sha-1 to use as a base reference.

Your configuration for the \`githubSha\` option is \`${stringify(githubSha)}\`.`,
  }),
};
