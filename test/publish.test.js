const test = require('ava');
const nock = require('nock');
const { stub } = require('sinon');
const proxyquire = require('proxyquire');
const { authenticate } = require('../semantic-release-github/test/helpers/mock-github');
const rateLimit = require('../semantic-release-github/test/helpers/rate-limit');
const path = require('path');

/* eslint camelcase: ["error", {properties: "never"}] */

const cwd = 'test/fixtures/files';
const publish = proxyquire('../lib/publish', {
  '@semantic-release/github/lib/get-client': proxyquire('@semantic-release/github/lib/get-client', {
    '@semantic-release/github/lib/definitions/rate-limit': rateLimit,
  }),
});

test.beforeEach((t) => {
  // Mock logger
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = { log: t.context.log, error: t.context.error };
});

test.afterEach.always(() => {
  // Clear nock
  nock.cleanAll();
});

test.serial('Create PR with 1 file but git binary does not exist on file system', async (t) => {
  const publish = proxyquire('../lib/publish', {
    '@semantic-release/github/lib/get-client': proxyquire('@semantic-release/github/lib/get-client', {
      '@semantic-release/github/lib/definitions/rate-limit': rateLimit,
    }),
    execa: function () {
      throw new Error('error executing git binary');
    },
  });
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"main","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(
    t.context.log.calledWith(
      "Unable to determine repository root path with `git`. Falling back to '%s'. Received error %s",
      './',
      'error executing git binary'
    )
  );
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with 1 file', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"main","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with 1 new file', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .times(4)
    .reply(404)
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"","branch":"${branch}"}`
    )
    .reply(201, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"main","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with 2 files', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt', 'file2.txt'];
  const pluginConfig = { assets };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const file2Path = path.join(cwd, 'file2.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file2Path)}?ref=${branch}`)
    .reply(302, { sha: '456' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file2Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"456","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"main","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith("Upload file '%s'", file2Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with pullrequest title', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets, pullrequestTitle: 'my title' };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"my title","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(`/repos/${owner}/${repo}/pulls`, `{"head":"${branch}","base":"main","title":"my title"}`)
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with labels', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets, labels: ['mylabel'] };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"main","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["mylabel"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with branch', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/newbranch';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets, baseRef: 'base', branch: 'newbranch' };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"base","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Creating branch '%s'", 'newbranch'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with branch already exist', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/newbranch-1';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets, baseRef: 'base', branch: 'newbranch' };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"refs/heads/newbranch","sha":"12345"}`)
    .reply(401)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"base","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Branch '%s' not created (error %d)", 'newbranch', 401));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'newbranch-1'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});

test.serial('Create PR with default branch already exist', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0-1';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets, baseRef: 'base' };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const file1Path = path.join(cwd, 'file1.txt');
  const github = authenticate(env)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"refs/heads/semantic-release-pr-1.0.0","sha":"12345"}`)
    .reply(401)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(file1Path)}`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(
      `/repos/${owner}/${repo}/pulls`,
      `{"head":"${branch}","base":"base","title":"chore(release): update release 1.0.0"}`
    )
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await t.notThrowsAsync(publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Branch '%s' not created (error %d)", 'semantic-release-pr-1.0.0', 401));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0-1'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});
