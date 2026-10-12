/**
 * Verify insertion utilities against real Angular CLI output, not manually maintained fixtures.
 * How this file was built: written with Node's test runner; no tool spec generator exists.
 * Why: formatting and generator changes must not let ng-add erase generated code.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');
const ts = require('typescript');
const {
  insertConstructor,
  insertImports,
  insertProviders,
  insertRoutes,
} = require('../dist/schematics/utils/insertions.js');
const runner = new SchematicTestRunner(
  '@schematics/angular',
  join(dirname(require.resolve('@schematics/angular/package.json')), 'collection.json')
);
const generated = await runner.runSchematic('ng-new', {
  name: 'target-app',
  version: require('@schematics/angular/package.json').version,
  directory: 'workspace',
  style: 'scss',
  skipInstall: true,
  skipGit: true,
  routing: true,
});

function content(path) {
  return generated.readContent(`/workspace/src/app/${path}`);
}

function diagnostics(filename, source) {
  const directory = join(dirname(fileURLToPath(import.meta.url)), '../.schematic-virtual-app');
  const files = new Map(
    ['app.ts', 'app.config.ts', 'app.routes.ts'].map(path => [
      join(directory, path),
      path === filename ? source : content(path),
    ])
  );
  const options = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    experimentalDecorators: true,
    skipLibCheck: true,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile;
  const fileExists = host.fileExists;
  const directoryExists = host.directoryExists;
  const getSourceFile = host.getSourceFile;
  host.readFile = path => files.get(path) ?? readFile(path);
  host.fileExists = path => files.has(path) || fileExists(path);
  host.directoryExists = path => path === directory || directoryExists(path);
  host.getSourceFile = (path, languageVersion, onError, shouldCreate) =>
    files.has(path)
      ? ts.createSourceFile(path, files.get(path), languageVersion, true)
      : getSourceFile(path, languageVersion, onError, shouldCreate);
  return ts
    .getPreEmitDiagnostics(ts.createProgram(Array.from(files.keys()), options, host))
    .filter(item => item.category === ts.DiagnosticCategory.Error);
}

function compiles(filename, source) {
  assert.deepEqual(
    diagnostics(filename, source).map(item =>
      ts.flattenDiagnosticMessageText(item.messageText, '\n')
    ),
    []
  );
}

test('adds separate imports, preserving generated imports and avoiding exact duplicates', () => {
  const original = content('app.ts');
  const addition = "import { inject } from '@angular/core';";
  const changed = insertImports(original, [addition, addition]);
  assert.equal(changed.match(/import \{ inject \}/g).length, 1);
  assert.ok(changed.includes("import { Component, signal } from '@angular/core';"));
  assert.equal(insertImports(changed, [addition]), changed);
  assert.throws(() => insertImports(original, ['const invalid = 1;']), /import declaration/);
  compiles('app.ts', changed);
  const reused = insertImports(original, ["import { signal, inject } from '@angular/core';"]);
  assert.equal(reused.match(/import.*\{.*signal/g).length, 1);
  compiles('app.ts', reused);
  assert.equal(insertImports(original, ['import { signal } from "@angular/core";']), original);
  assert.throws(
    () => insertImports(original, ["import { effect as signal } from '@angular/core';"]),
    /Conflicting import/
  );
  assert.throws(() => insertImports(original, ['import { inject } from ;']), /Invalid TypeScript/);
  for (const addition of [
    "import { inject, inject } from '@angular/core';",
    "import { inject, effect as inject } from '@angular/core';",
  ]) {
    assert.throws(() => insertImports(original, [addition]), /Duplicate import binding/);
  }
});

test('inserts providers without replacing the generated calls or Router configuration', () => {
  const original = content('app.config.ts');
  const additions = ['provideHttpClient()', 'provideAppInitializer(() => undefined)'];
  const changed = insertImports(insertProviders(original, additions), [
    "import { provideHttpClient } from '@angular/common/http';",
    "import { provideAppInitializer } from '@angular/core';",
  ]);
  assert.ok(changed.includes('provideBrowserGlobalErrorListeners()'));
  assert.ok(changed.includes('provideRouter(routes)'));
  assert.ok(changed.includes('provideHttpClient(),\nprovideAppInitializer(() => undefined)'));
  assert.equal(insertProviders(changed, additions), changed);
  compiles('app.config.ts', changed);
  const repeated = insertProviders(original, ['provideHttpClient()', 'provideHttpClient()']);
  assert.equal(repeated.match(/provideHttpClient\(\)/g).length, 1);
  for (const trailing of ['', ',']) {
    const single = insertProviders(
      original
        .replace(/provideRouter\(routes\)/, '')
        .replace(
          /provideBrowserGlobalErrorListeners\(\),/,
          `provideBrowserGlobalErrorListeners()${trailing}`
        ),
      ['provideAppInitializer(() => undefined)']
    );
    compiles(
      'app.config.ts',
      insertImports(single, ["import { provideAppInitializer } from '@angular/core';"])
    );
  }
  assert.throws(() => insertProviders(original, ['broken(']), /Invalid TypeScript/);
  assert.throws(() => insertProviders(original, ['first(), second()']), /one provider/);
  assert.throws(() => insertProviders('const appConfig = createConfig();', []), /object literal/);
});

test('inserts routes into the generated empty array and rejects existing user routes', () => {
  const original = content('app.routes.ts');
  const changed = insertRoutes(
    original,
    "{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },"
  );
  assert.ok(changed.includes("import { Routes } from '@angular/router';"));
  compiles('app.routes.ts', changed);
  assert.throws(() => insertRoutes(changed, ''), /existing routes/);
});

test('preserves the generated title, selector and decorators while adding a constructor', () => {
  const original = content('app.ts');
  const constructor = 'constructor() { inject(Router); }';
  const changed = insertImports(insertConstructor(original, constructor), [
    "import { inject } from '@angular/core';",
    "import { Router } from '@angular/router';",
  ]);
  assert.ok(changed.includes("signal('target-app')"));
  assert.ok(changed.includes("selector: 'app-root'"));
  assert.ok(changed.includes(constructor));
  compiles('app.ts', changed);
  assert.throws(() => insertConstructor(changed, 'constructor() {}'), /existing.*constructor/);
  assert.throws(() => insertConstructor(original, 'method() {}'), /constructor declaration/);
  assert.throws(() => insertConstructor(original, 'constructor() {'), /Invalid TypeScript/);
  assert.throws(
    () => insertConstructor(original, 'constructor() {} } export class Escape {'),
    /only one constructor/
  );
});

test('compilation checks reject duplicate identifiers and missing function bindings', () => {
  const original = content('app.ts');
  assert.ok(
    diagnostics('app.ts', original + "\nimport { signal } from '@angular/core';").some(
      item => item.code === 2300
    )
  );
  assert.ok(
    diagnostics('app.ts', insertConstructor(original, 'constructor() { missingFunction(); }')).some(
      item => item.code === 2304
    )
  );
});
