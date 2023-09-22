const { template } = require('lodash');
const urljoin = require('url-join');
const resolveConfig = require('./resolve-config');
const parseGithubUrl = require('@semantic-release/github/lib/parse-github-url');
const { Base64 } = require('js-base64');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { Octokit: OctokitCore } = require('@octokit/core');
const { createPullRequest } = require('octokit-plugin-create-pull-request');
const { readFile } = require('fs-extra');
const AggregateError = require('aggregate-error');
const execa = require('execa');
const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');

module.exports = async (pluginConfig, context) => {
  const {
    cwd,
    options: { repositoryUrl },
    nextRelease,
    logger,
  } = context;
  const {
    githubToken,
    githubUrl,
    githubApiPathPrefix,
    githubSha,
    proxy,
    assets,
    branch,
    pullrequestTitle,
    labels,
    baseRef,
  } = resolveConfig(pluginConfig, context);
  const { owner, repo } = parseGithubUrl(repositoryUrl);
  let absoluteRepoPath = './';
  try {
    absoluteRepoPath = (await execa('git', ['rev-parse', '--show-toplevel'])).stdout;
  } catch (e) {
    logger.log(
      "Unable to determine repository root path with `git`. Falling back to '%s'. Received error %s",
      absoluteRepoPath,
      e.message
    );
  }

  const baseUrl = githubUrl && urljoin(githubUrl, githubApiPathPrefix);
  const octokit = new Octokit({
    auth: `token ${githubToken}`,
    baseUrl,
    request: {
      agent: proxy
        ? baseUrl && new URL(baseUrl).protocol.replace(':', '') === 'http'
          ? // Some `proxy.headers` need to be passed as second arguments since version 6 or 7
            // For simplicity, we just pass the same proxy object twice. It works 🤷🏻
            new HttpProxyAgent(proxy, proxy)
          : new HttpsProxyAgent(proxy, proxy)
        : undefined,
    },
  });
  const PullRequestCreator = OctokitCore.plugin(createPullRequest);
  const octokitExtended = new PullRequestCreator({
    auth: githubToken,
  });

  logger.log('Creating a pull request for version %s', nextRelease.version);

  const pullrequestTitleExt = template(pullrequestTitle)(context);

  const branchExt = template(branch)(context);
  let newBranch = branchExt;

  // Change branch name if it already exist
  let i = 0;
  let ref = '';
  while (true) {
    if (i > 10) {
      throw new AggregateError(["No free branch available, try to delete branches or define a 'branch' option."]);
    }

    try {
      ref = `refs/heads/${newBranch}`;
      // Create new branch
      logger.log("Creating branch '%s'", newBranch);
      await octokit.git.createRef({
        owner,
        repo,
        ref,
        sha: githubSha,
      });
      break;
    } catch (error) {
      logger.log("Branch '%s' not created (error %s)", newBranch, error.message);
      newBranch = `${branchExt}-${++i}`;
    }
  }

  const changedFiles = {};
  const filesPromises = await Promise.all(
    assets.map(async (filePath) => {
      const absoluteFilePath = path.resolve(cwd, filePath);
      const uploadPath = path.relative(absoluteRepoPath, absoluteFilePath);

      const content = await readFile(absoluteFilePath);
      const contentEncoded = Base64.encode(content);
      return {
        filePath: uploadPath,
        content: contentEncoded,
        encoding: 'base64',
      };
    })
  );
  filesPromises.forEach((file) => {
    changedFiles[file.filePath] = {
      content: file.content,
      encoding: file.encoding,
    };
  });

  logger.log('Create a pull request');
  const pr = await octokitExtended.createPullRequest({
    owner,
    repo,
    title: pullrequestTitleExt,
    head: newBranch,
    base: baseRef,
    labels,
    body: '',
    message: pullrequestTitleExt,
    changes: [
      {
        files: changedFiles,
        commit: pullrequestTitleExt,
      },
    ],
  });

  return { number: pr.data.number, html_url: pr.data.html_url };
};
