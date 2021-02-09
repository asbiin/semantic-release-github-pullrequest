const { isNil, castArray } = require('lodash');
const resolveConfig = require('@semantic-release/github/lib/resolve-config');

module.exports = (pluginConfig, { env }) => {
  const { githubSha, assets, branch, pullrequestTitle, baseRef } = pluginConfig;
  const { githubToken, githubUrl, githubApiPathPrefix, proxy, labels } = resolveConfig(pluginConfig, { env });
  return {
    githubToken: env.GH_TOKEN_RELEASE || githubToken,
    githubUrl,
    githubApiPathPrefix,
    proxy,
    labels,
    githubSha: githubSha || env.GH_SHA || env.GITHUB_SHA,
    assets: assets ? castArray(assets) : assets,
    branch: isNil(branch)
      ? `semantic-release-pr<%= nextRelease.version ? \`-\${nextRelease.version}\` : "" %>`
      : branch,
    pullrequestTitle: isNil(pullrequestTitle)
      ? `chore(release): update release<%= nextRelease.version ? \` \${nextRelease.version}\` : "" %>`
      : pullrequestTitle,
    baseRef: isNil(baseRef) ? 'main' : baseRef,
  };
};
