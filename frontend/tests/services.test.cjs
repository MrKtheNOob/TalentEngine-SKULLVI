const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

function loadService(name, api) {
  const file = path.join(__dirname, '../src/services', name + '.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, Error,
    require: (name) => { if (name === 'axios') return axios; assert.equal(name, './api'); return { api }; },
  });
  return module.exports;
}

test('services forward routes, query filters, and write payloads', async () => {
  const requests = [];
  const payload = { id: 3 };
  const api = axios.create({ adapter: async (config) => {
    requests.push(config);
    return { data: payload, status: 200, statusText: 'OK', headers: {}, config };
  }});
  const programs = loadService('programService', api);
  const applications = loadService('programApplicationService', api);
  const candidates = loadService('candidateService', api);
  const result = await programs.getPrograms({ search: 'Développement', sort: 'candidates' });
  assert.equal(result.data, payload);
  assert.equal(result.error, null);
  assert.equal(requests[0].params.search, 'Développement');
  assert.equal(requests[0].params.sort, 'candidates');
  await programs.getProgram(3);
  await programs.createProgram({ name: 'New' });
  await programs.updateProgram(3, { description: null });
  await programs.getProgramOverview(3);
  await candidates.getProgramCandidates(3);
  await applications.getProgramApplications(3, { status: 'needs_review', sort: 'recent', search: 'Awa' });
  await applications.getProgramApplication(3, 7);
  assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
    ['get', '/programs/'], ['get', '/programs/3'], ['post', '/programs/'],
    ['patch', '/programs/3'], ['get', '/programs/3/overview'],
    ['get', '/programs/3/candidates'], ['get', '/programs/3/applications'],
    ['get', '/programs/3/applications/7'],
  ]);
  assert.equal(JSON.parse(requests[3].data).description, null);
  assert.equal(requests[6].params.status, 'needs_review');
});

test('services return failures and preserve HTTP validation details', async () => {
  const details = { detail: [{ loc: ['body', 'name'], msg: 'Name cannot be blank' }] };
  const failure = new axios.AxiosError('Validation failed', 'ERR_BAD_REQUEST', {}, {}, {
    status: 422, data: details,
  });
  const api = axios.create({ adapter: async () => { throw failure; } });
  const programs = loadService('programService', api);
  const applications = loadService('programApplicationService', api);
  const candidates = loadService('candidateService', api);
  for (const operation of [
    () => programs.getPrograms(), () => programs.getProgram(3),
    () => programs.createProgram({ name: '' }), () => programs.updateProgram(3, { name: '' }),
    () => programs.getProgramOverview(3), () => candidates.getProgramCandidates(3),
    () => applications.getProgramApplications(3), () => applications.getProgramApplication(3, 7),
  ]) {
    const result = await operation();
    assert.equal(result.data, null);
    assert.equal(result.error, failure);
    assert.equal(result.error.response.data, details);
  }
  api.defaults.adapter = async () => { throw new Error('Network unavailable'); };
  const network = await programs.getPrograms();
  assert.equal(network.data, null);
  assert.equal(network.error.message, 'Network unavailable');
});


test('configuration and candidate detail services use the current contracts', async () => {
  const requests = [];
  const data = { programId: 3, criteria: [] };
  const api = axios.create({ adapter: async (config) => {
    requests.push(config);
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  }});
  const config = loadService('configurationService', api);
  const candidates = loadService('candidateService', api);
  assert.equal((await config.getConfiguration(3)).data, data);
  await config.saveConfiguration(data);
  await config.rescoreApplications(3);
  await candidates.getCandidateDetail(3, 5, 7);
  assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
    ['get', '/programs/3/configuration'], ['put', '/programs/3/configuration'],
    ['post', '/programs/3/configuration/rescore'], ['get', '/programs/3/candidates/5'],
  ]);
  assert.equal(requests[3].params.application_id, 7);
  api.defaults.adapter = async () => { throw new axios.AxiosError('HTTP 501', 'ERR_BAD_RESPONSE', {}, {}, {
    status: 501, data: { detail: 'Scoring engine unavailable' },
  }); };
  const result = await config.rescoreApplications(3);
  assert.equal(result.data, null);
  assert.equal(result.error.message, 'Scoring engine unavailable');
  assert.equal(result.error.response.status, 501);
});
