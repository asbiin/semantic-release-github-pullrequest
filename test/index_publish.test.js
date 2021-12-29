const test = require('ava');
const nock = require('nock');
const {stub} = require('sinon');
const proxyquire = require('proxyquire');
const clearModule = require('clear-module');
const {authenticate} = require('../semantic-release-github/test/helpers/mock-github');
const rateLimit = require('../semantic-release-github/test/helpers/rate-limit');
const path = require('path');

const cwd = 'test/fixtures/files';
const client = proxyquire(
  '@semantic-release/github/lib/get-client', proxyquire('@semantic-release/github/lib/get-client', {
    '@semantic-release/github/lib/definitions/rate-limit': rateLimit,
  }));
const index = proxyquire('..', {
    './lib/verify': proxyquire('../lib/verify', {'@semantic-release/github/lib/get-client': client}),
    './lib/publish': proxyquire('../lib/publish', {'@semantic-release/github/lib/get-client': client}),
  });

test.beforeEach((t) => {
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = index;
  // Stub the logger
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test.afterEach.always(() => {
  // Clear nock
  nock.cleanAll();
});

test.serial('Run publish with 1 file', async (t) => {
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
    .get(`/repos/${owner}/${repo}`)
    .reply(200, { permissions: { push: true } })
    .get(`/repos/${owner}/${repo}/git/commits/12345`)
    .reply(200)
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

  await t.notThrowsAsync(index.publish(pluginConfig, { env, cwd, options, nextRelease, logger: t.context.logger }));

  t.true(t.context.log.calledWith("Creating branch '%s'", 'semantic-release-pr-1.0.0'));
  t.true(t.context.log.calledWith('Creating a pull request for version %s', '1.0.0'));
  t.true(t.context.log.calledWith("Upload file '%s'", file1Path));
  t.true(t.context.log.calledWith('Pull Request created: %s', `https://github.com/${owner}/${repo}/pull/1`));
  t.true(github.isDone());
});
