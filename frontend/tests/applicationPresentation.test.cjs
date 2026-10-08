const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadComponent(file) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require: (name) => {
      if (!name.startsWith('.')) return require(name);
      const target = path.resolve(path.dirname(file), name);
      const resolved = [target + '.tsx', target + '.ts'].find(fs.existsSync);
      return loadComponent(resolved);
    },
  });
  return module.exports;
}
const folder = path.join(__dirname, '../src/components/candidates');
const Value = loadComponent(path.join(folder, 'ExtractedFactValue.tsx')).default;
const Details = loadComponent(path.join(folder, 'CandidateApplicationDetails.tsx')).default;
const Processing = loadComponent(path.join(folder, 'CandidateProcessingDetails.tsx')).default;
const application = { name: 'Awa', email: 'awa@example.com', status: 'ready', cvUrl: null, portfolioUrl: null };
const normalized = {
  education: [{ degree: 'Licence informatique', institution: 'Université Exemple', year: 2025 }],
  skills: ['Python', 'Java'],
  experience: [{ role: 'Développeuse', company: 'Entreprise Exemple', responsibilities: ['Créer une API', 'Écrire des tests'] }],
  availability: 'Six mois',
  projects: [{ title: 'Import CSV', technologies: ['Python'] }],
};

test('nested education and experience render as readable entries without JSON', () => {
  const html = renderToStaticMarkup(React.createElement(Details, { application, normalized }));
  for (const label of ['Formation', 'Diplôme', 'Licence informatique', 'Établissement', 'Expérience', 'Poste', 'Développeuse', 'Entreprise Exemple', 'Créer une API']) {
    assert.ok(html.includes(label), label);
  }
  assert.ok(html.includes('bg-blue-50'));
  assert.ok(!html.includes('Import CSV'));
  assert.ok(!html.includes('&quot;degree&quot;'));
  assert.ok(!html.includes('[object Object]'));
});

test('additional facts appear in extraction without duplicating fixed fields', () => {
  const html = renderToStaticMarkup(React.createElement(Processing, { application, normalized }));
  assert.ok(html.includes('Autres informations extraites'));
  assert.ok(html.includes('Projets'));
  assert.ok(html.includes('Import CSV'));
  assert.ok(!html.includes('Licence informatique'));
  assert.ok(!html.includes('Développeuse'));
});

test('missing and legacy string facts remain readable', () => {
  for (const value of [null, undefined, '', [], {}]) {
    assert.ok(renderToStaticMarkup(React.createElement(Value, { value })).includes('Non fourni'));
  }
  assert.ok(renderToStaticMarkup(React.createElement(Value, { value: 'Un stage de trois mois.' })).includes('Un stage de trois mois.'));
  assert.ok(renderToStaticMarkup(React.createElement(Value, { value: { available: false, years: 0 } })).includes('Non'));
});
