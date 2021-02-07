const { isNil, castArray } = require('lodash');

module.exports = (
  { githubUrl, githubApiPathPrefix, githubSha, proxy, assets, branch, pullrequestTitle, labels, baseRef },
  { env }
) => ({
  githubToken: env.GH_TOKEN_RELEASE || env.GH_TOKEN || env.GITHUB_TOKEN,
  githubUrl: githubUrl || env.GITHUB_API_URL || env.GH_URL || env.GITHUB_URL,
  githubApiPathPrefix: githubApiPathPrefix || env.GH_PREFIX || env.GITHUB_PREFIX || '',
  githubSha: githubSha || env.GH_SHA || env.GITHUB_SHA,
  proxy: proxy || env.HTTP_PROXY,
  assets: assets ? castArray(assets) : assets,
  branch: isNil(branch) ? `semantic-release-pr<%= nextRelease.version ? \`-\${nextRelease.version}\` : "" %>` : branch,
  pullrequestTitle: isNil(pullrequestTitle)
    ? `chore(release): update release<%= nextRelease.version ? \` \${nextRelease.version}\` : "" %>`
    : pullrequestTitle,
  labels: isNil(labels) ? ['semantic-release'] : labels === false ? false : castArray(labels),
  baseRef: isNil(baseRef) ? 'main' : baseRef,
});
