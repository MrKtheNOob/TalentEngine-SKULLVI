const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Run the hook's effect with a virtual clock; no DOM or new dependency needed.
function mountJobCheck(statuses) {
  let effect, now = 0, nextTimer = 0, round = 0;
  const timers = new Map();
  const calls = [], states = [];
  const success = (status) => ({ data: status ? [{ status }] : [], error: null });
  const services = {
    getImports: async (programId) => { calls.push(['import', programId]); return success(statuses[round]); },
    getScoringJobs: async (programId) => { calls.push(['scoring', programId]); return success(statuses[round++]); },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(`${__dirname}/../src/hooks/useProgramJobs.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    require: (name) => {
      if (name === '../services/jobService') return services;
      assert.equal(name, 'react');
      return {
        useEffect: (callback) => { effect = callback; },
        useState: (initial) => {
          const index = states.length;
          states.push(initial);
          return [initial, (update) => { states[index] = typeof update === 'function' ? update(states[index]) : update; }];
        },
      };
    },
  });
  module.exports.useProgramJobs(1);
  const cleanup = effect();
  return {
    calls, states, timers, cleanup,
    async tick(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of timers) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
      await new Promise(setImmediate);
    },
  };
}

test('idle program does not keep polling', async () => {
  const hook = mountJobCheck([undefined]);
  await hook.tick(0);
  await hook.tick(30_000);
  assert.equal(hook.calls.length, 2);
  assert.equal(hook.timers.size, 0);
  hook.cleanup();
});

test('pending/running jobs refresh every three seconds and stop after final completion', async () => {
  const hook = mountJobCheck(['pending', 'running', 'completed']);
  await hook.tick(0);
  await hook.tick(1000);
  assert.equal(hook.calls.length, 2);
  await hook.tick(2000);
  assert.equal(hook.calls.length, 4);
  assert.equal(hook.states[0], 1);
  await hook.tick(3000);
  assert.equal(hook.calls.length, 6);
  assert.equal(hook.states[0], 2);
  await hook.tick(30_000);
  assert.equal(hook.calls.length, 6);
  assert.equal(hook.timers.size, 0);
  assert.ok(hook.calls.every(([, programId]) => programId === 1));
  hook.cleanup();
});
