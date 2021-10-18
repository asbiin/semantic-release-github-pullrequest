const { template } = require('lodash');
const resolveConfig = require('./resolve-config');
const parseGithubUrl = require('@semantic-release/github/lib/parse-github-url');
const { Base64 } = require('js-base64');
const path = require('path');
const getClient = require('@semantic-release/github/lib/get-client');
const { readFile } = require('fs-extra');
const AggregateError = require('aggregate-error');
const execa = require('execa');

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

  const github = getClient({ githubToken, githubUrl, githubApiPathPrefix, proxy });

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
      await github.git.createRef({
        owner,
        repo,
        ref,
        sha: githubSha,
      });
      break;
    } catch (error) {
      logger.log("Branch '%s' not created (error %d)", newBranch, error.status);
      newBranch = `${branchExt}-${++i}`;
    }
  }

  await Promise.all(
    assets.map(async (filePath) => {
      const absoluteFilePath = path.resolve(cwd, filePath);
      const uploadPath = path.relative(absoluteRepoPath, absoluteFilePath);

      // Get current file's sha
      let commitSha = '';
      try {
        const {
          data: { sha },
        } = await github.repos.getContent({
          owner,
          repo,
          path: uploadPath,
          ref,
        });
        commitSha = sha;
      } catch (error) {
        if (error.status === 404) {
          // ignore error
        }
      }

      const content = await readFile(absoluteFilePath);
      const contentEncoded = Base64.encode(content);

      logger.log("Upload file '%s'", uploadPath);

      // Update file's content
      await github.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: uploadPath,
        message: pullrequestTitleExt,
        content: contentEncoded,
        sha: commitSha,
        branch: ref,
      });
    })
  );

  // Create a pull request
  const {
    data: { number, html_url: htmlUrl },
  } = await github.pulls.create({
    owner,
    repo,
    head: ref,
    base: baseRef,
    title: pullrequestTitleExt,
  });

  // Add labels
  if (labels !== false && labels.length > 0) {
    await github.issues.setLabels({
      owner,
      repo,
      issue_number: number,
      labels,
    });
  }

  logger.log('Pull Request created: %s', htmlUrl);
  return { number, html_url: htmlUrl };
};
