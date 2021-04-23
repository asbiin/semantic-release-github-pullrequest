# semantic-release-github-pullrequest

This plugin is a plugin for [**semantic-release**](https://github.com/semantic-release/semantic-release).

It automatically creates a pull request containing changes for any files you want to publish in your repository, like release notes of your newly published release.

[![npm](https://img.shields.io/npm/v/semantic-release-github-pullrequest.svg?style=flat-square)](https://www.npmjs.com/package/semantic-release-github-pullrequest)
[![npm](https://img.shields.io/npm/dm/semantic-release-github-pullrequest.svg?style=flat-square)](https://www.npmjs.com/package/semantic-release-github-pullrequest)
[![Build](https://img.shields.io/github/workflow/status/asbiin/semantic-release-github-pullrequest/Build%20and%20test/main)](https://github.com/asbiin/semantic-release-github-pullrequest/actions?query=workflow%3A%22Build+and+test%22)
[![Code coverage](https://img.shields.io/sonar/coverage/asbiin_semantic-release-github-pullrequest?server=https%3A%2F%2Fsonarcloud.io)](https://sonarcloud.io/project/activity?custom_metrics=coverage&amp;graph=custom&amp;id=asbiin_semantic-release-github-pullrequest)
[![Lines of Code](https://img.shields.io/tokei/lines/github/asbiin/semantic-release-github-pullrequest)](https://sonarcloud.io/dashboard?id=asbiin_semantic-release-github-pullrequest)
[![License](https://img.shields.io/github/license/asbiin/semantic-release-github-pullrequest)](https://opensource.org/licenses/MIT)

| Step               | Description                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `verifyConditions` | Verify that all needed configuration is present.                                                 |
| `publish`          | Create a branch to upload all assets and create the pull request on the base branch on GitHub. |


## Install

Add the plugin to your npm-project:

```console
npm install semantic-release-github-pullrequest -D
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "semantic-release-github-pullrequest", {
        "assets": ["CHANGELOG.md"],
        "baseRef": "main"
      }
    ]
  ]
}
```

With this example, a GitHub pull request will be created, with the content of `CHANGELOG.md` file, on the `main` branch.

## Configuration

### GitHub authentication

The GitHub authentication configuration is **required** and can be set via [environment variables](#environment-variables).

Follow the [Creating a personal access token for the command line](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line) documentation to obtain an authentication token. The token has to be made available in your CI environment via the `GH_TOKEN_RELEASE` or `GH_TOKEN` environment variable. The user associated with the token must have push permission to the repository.

When creating the token, the **minimum required scopes** are:

- [`repo`](https://github.com/settings/tokens/new?scopes=repo) for a private repository
- [`public_repo`](https://github.com/settings/tokens/new?scopes=public_repo) for a public repository

_Note on GitHub Actions:_ You can use the default token which is provided in the secret _GITHUB_TOKEN_. However [no workflows will be triggered in the Pull Request](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#triggering-new-workflows-using-a-personal-access-token), providing it to be merged.
You can use `GH_TOKEN` or `GITHUB_TOKEN` with the secret _GITHUB_TOKEN_ to create the release, and use `GH_TOKEN_RELEASE` with this plugin to create the Pull Request.

### Environment variables

| Variable                                           | Description                                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GH_TOKEN_RELEASE`, `GH_TOKEN` or `GITHUB_TOKEN`   | **Required.** The token used to authenticate with GitHub.                                                                      |
| `GITHUB_API_URL` or `GH_URL` or `GITHUB_URL`       | The GitHub Enterprise endpoint.                                                                                                |
| `GH_PREFIX` or `GITHUB_PREFIX`                     | The GitHub Enterprise API prefix.                                                                                              |
| `GH_SHA` or `GITHUB_SHA`                           | The commit sha reference to create the new branch for the pull request. On GitHub Actions, this variable is automatically set. |

### Options

| Option                | Description                                                                                                                                      | Default                                                     |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| `githubUrl`           | The GitHub Enterprise endpoint.                                                                                                                  | `GH_URL` or `GITHUB_URL` environment variable.                                                 |
| `githubApiPathPrefix` | The GitHub Enterprise API prefix.                                                                                                                | `GH_PREFIX` or `GITHUB_PREFIX` environment variable.                                           |
| `proxy`               | The proxy to use to access the GitHub API. Set to `false` to disable usage of proxy. See [proxy](#proxy).                                                                                  | `HTTP_PROXY` environment variable.                                                             |
| `assets`              | **Required.**. An array of files to upload to the release. See [assets](#assets).                                                                | -                                                                                              |
| `branch`              | Name of the branch that will be created in the repository.                                                                                       | `semantic-release-pr<%= nextRelease.version ? \`-\${nextRelease.version}\` : "" %>`            |
| `pullrequestTitle`    | Title for the pull request. This title will also be used for all commit created to upload the assets. See [pullrequestTitle](#pullrequestTitle). | `chore(release): update release<%= nextRelease.version ? \` \${nextRelease.version}\` : "" %>` |
| `labels`              | The [labels](https://help.github.com/articles/about-labels) to add to the pull request created. Set to `false` to not add any label.             | `['semantic-release']`                                                                         |
| `baseRef`             | The base branch used to create the pull request (usually `main` or `master`).                                                                    | `main`                                                                                         |



#### proxy

Can be `false`, a proxy URL or an `Object` with the following properties:

| Property      | Description                                                    | Default                              |
|---------------|----------------------------------------------------------------|--------------------------------------|
| `host`        | **Required.** Proxy host to connect to.                        | -                                    |
| `port`        | **Required.** Proxy port to connect to.                        | File name extracted from the `path`. |
| `secureProxy` | If `true`, then use TLS to connect to the proxy.               | `false`                              |
| `headers`     | Additional HTTP headers to be sent on the HTTP CONNECT method. | -                                    |

See [node-https-proxy-agent](https://github.com/TooTallNate/node-https-proxy-agent#new-httpsproxyagentobject-options) and [node-http-proxy-agent](https://github.com/TooTallNate/node-http-proxy-agent) for additional details.

##### proxy examples

`'http://168.63.76.32:3128'`: use the proxy running on host `168.63.76.32` and port `3128` for each GitHub API request.
`{host: '168.63.76.32', port: 3128, headers: {Foo: 'bar'}}`: use the proxy running on host `168.63.76.32` and port `3128` for each GitHub API request, setting the `Foo` header value to `bar`.

#### assets

Can be a [glob](https://github.com/isaacs/node-glob#glob-primer) or and `Array` of
[globs](https://github.com/isaacs/node-glob#glob-primer) and `Object`s with the following properties:

| Property | Description                                                                                              | Default                              |
| -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `path`   | **Required.** A [glob](https://github.com/isaacs/node-glob#glob-primer) to identify the files to upload. | -                                    |
| `name`   | The name of the downloadable file on the GitHub release.                                                 | File name extracted from the `path`. |
| `label`  | Short description of the file displayed on the GitHub release.                                           | -                                    |

Each entry in the `assets` `Array` is globbed individually. A [glob](https://github.com/isaacs/node-glob#glob-primer)
can be a `String` (`"dist/**/*.js"` or `"dist/mylib.js"`) or an `Array` of `String`s that will be globbed together
(`["dist/**", "!**/*.css"]`).

If a directory is configured, all the files under this directory and its children will be included.

The `name` and `label` for each assets are generated with [Lodash template](https://lodash.com/docs#template). The following variables are available:

| Parameter     | Description                                                                         |
|---------------|-------------------------------------------------------------------------------------|
| `branch`      | The branch from which the release is done.                                          |
| `lastRelease` | `Object` with `version`, `gitTag` and `gitHead` of the last release.                |
| `nextRelease` | `Object` with `version`, `gitTag`, `gitHead` and `notes` of the release being done. |
| `commits`     | `Array` of commit `Object`s with `hash`, `subject`, `body` `message` and `author`.  |

**Note**: If a file has a match in `assets` it will be included even if it also has a match in `.gitignore`.

#### pullrequestTitle

The title of the pull request is generated with [Lodash template](https://lodash.com/docs#template). The following variables are available:

| Parameter     | Description                                                                                                                                                                                                                                                                   |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `branch`      | `Object` with `name`, `type`, `channel`, `range` and `prerelease` properties of the branch from which the release is done.                                                                                                                                                    |
| `lastRelease` | `Object` with `version`, `channel`, `gitTag` and `gitHead` of the last release.                                                                                                                                                                                               |
| `nextRelease` | `Object` with `version`, `channel`, `gitTag`, `gitHead` and `notes` of the release being done.                                                                                                                                                                                |
| `releases`    | `Array` with a release `Object`s for each release published, with optional release data such as `name` and `url`.                                                                                                                                                             |
