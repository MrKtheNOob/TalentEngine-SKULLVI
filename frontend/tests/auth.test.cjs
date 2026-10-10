const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, dependencies) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, Error,
    require: name => dependencies[name] ?? require(name),
  });
  return module.exports;
}

test('protected route waits, redirects anonymous users, and allows signed-in users', () => {
  let auth = { user: null, loading: true, error: null };
  let redirect;
  const Guard = load('components/ProtectedRoute.tsx', {
    '../hooks/useAuth': { useAuth: () => auth },
    'react-router-dom': {
      Navigate: props => { redirect = props; return null; },
      Outlet: () => React.createElement('p', null, 'Protected content'),
    },
  }).default;
  const render = () => renderToStaticMarkup(React.createElement(Guard));
  assert.match(render(), /Vérification de la session/);
  assert.equal(redirect, undefined);
  auth = { ...auth, loading: false };
  assert.equal(render(), '');
  assert.equal(redirect.to, '/login');
  assert.equal(redirect.replace, true);
  redirect = undefined;
  auth = { ...auth, user: { id: 1 } };
  assert.match(render(), /Protected content/);
  assert.equal(redirect, undefined);
  auth = { user: null, loading: false, error: new Error('Network unavailable') };
  assert.match(render(), /Impossible de vérifier la session/);
  assert.equal(redirect, undefined);
});

test('auth service logs in, fetches identity, and logs out without exposing JWTs', async () => {
  const calls = [];
  const user = { id: 1, username: 'test', email: 'test@example.com' };
  const api = {
    post: async (url, payload) => { calls.push({ url, payload }); },
    get: async url => { calls.push({ url }); return { data: user }; },
  };
  const service = load('services/authService.ts', { './api': { api } });
  const credentials = { email: user.email, password: 'test-password' };
  const result = await service.login(credentials);
  assert.equal(result.data, user);
  assert.equal(result.error, null);
  assert.equal(calls[0].url, '/auth/login');
  assert.equal(calls[0].payload, credentials);
  assert.equal(calls[1].url, '/auth/me');
  assert.equal((await service.logout()).error, null);
  assert.equal(calls[2].url, '/auth/logout');
});

test('failed login does not fetch identity and failed logout is returned to the provider', async () => {
  const failure = new Error('Unauthorized');
  let identityRequests = 0;
  const api = {
    post: async () => { throw failure; },
    get: async () => { identityRequests++; },
  };
  const service = load('services/authService.ts', { './api': { api } });
  assert.equal((await service.login({ email: 'test@example.com', password: 'wrong' })).error, failure);
  assert.equal(identityRequests, 0);
  assert.equal((await service.logout()).error, failure);
});
