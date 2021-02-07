const test = require('ava');
const nock = require('nock');
const { stub } = require('sinon');
const proxyquire = require('proxyquire');
const { authenticate } = require('../semantic-release-github/test/helpers/mock-github');
const rateLimit = require('../semantic-release-github/test/helpers/rate-limit');

/* eslint camelcase: ["error", {properties: "never"}] */

const cwd = 'test/fixtures/files';
const success = proxyquire('../lib/success', {
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

test.serial('Create PR with 1 file', async (t) => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const branch = 'refs/heads/semantic-release-pr-1.0.0';
  const env = { GITHUB_TOKEN: 'github_token', GITHUB_SHA: '12345' };
  const assets = ['file1.txt'];
  const pluginConfig = { assets };
  const options = { branch: 'main', repositoryUrl: `https://github.com/${owner}/${repo}.git` };
  const nextRelease = { version: '1.0.0' };
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fsemantic-release-pr-1.0.0`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
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

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' is free", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
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
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fsemantic-release-pr-1.0.0`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .times(4)
    .reply(404)
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
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

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' is free", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
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
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fsemantic-release-pr-1.0.0`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
      `{"message":"chore(release): update release 1.0.0","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .get(`/repos/${owner}/${repo}/contents/file2.txt?ref=${branch}`)
    .reply(302, { sha: '456' })
    .put(
      `/repos/${owner}/${repo}/contents/file2.txt`,
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

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' is free", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file2.txt'));
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
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fsemantic-release-pr-1.0.0`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
      `{"message":"my title","content":"VXBsb2FkIGZpbGUgY29udGVudA==","sha":"123","branch":"${branch}"}`
    )
    .reply(200, {})
    .post(`/repos/${owner}/${repo}/pulls`, `{"head":"${branch}","base":"main","title":"my title"}`)
    .reply(200, { number: 1, html_url: `https://github.com/${owner}/${repo}/pull/1` })
    .put(`/repos/${owner}/${repo}/issues/1/labels`, '{"labels":["semantic-release"]}')
    .reply(200, {});

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' is free", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
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
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fsemantic-release-pr-1.0.0`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
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

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' is free", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
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
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fnewbranch`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
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

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' is free", 'newbranch'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'newbranch'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
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
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fnewbranch`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fnewbranch-1`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
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

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' already exist", 'newbranch'));
  t.true(t.context.log.calledWith("Branch '%s' is free", 'newbranch-1'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'newbranch-1'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
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
  const github = authenticate(env)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fsemantic-release-pr-1.0.0`)
    .reply(200)
    .get(`/repos/${owner}/${repo}/git/ref/heads%2Fsemantic-release-pr-1.0.0-1`)
    .times(4)
    .reply(404)
    .post(`/repos/${owner}/${repo}/git/refs`, `{"ref":"${branch}","sha":"12345"}`)
    .reply(201, { ref: branch })
    .get(`/repos/${owner}/${repo}/contents/file1.txt?ref=${branch}`)
    .reply(302, { sha: '123' })
    .put(
      `/repos/${owner}/${repo}/contents/file1.txt`,
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

  await success(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger });

  t.true(t.context.log.calledWith("Branch '%s' already exist", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith("Branch '%s' is free", 'semantic-release-pr-1.0.0-1'));
  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0-1'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", 'file1.txt'));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});
