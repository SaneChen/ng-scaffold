/**
 * Integration tests of the packaged ng-add rule against the installed Angular generator.
 * How this file was built: written with DevKit's SchematicTestRunner and Node's test runner.
 * Why: options and project paths must be tested on real generated workspaces, without downloads.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const angularCollection = join(
  dirname(require.resolve('@schematics/angular/package.json')),
  'collection.json'
);
const version = require('@schematics/angular/package.json').version;
const ts = require('typescript');
const { JSONFile } = require('@schematics/angular/utility/json-file');
const sass = require('sass');

async function workspace() {
  const runner = new SchematicTestRunner(
    'ng-scaffold',
    join(root, 'dist/schematics/collection.json')
  );
  runner.registerCollection('@schematics/angular', angularCollection);
  const tree = await runner.runExternalSchematic('@schematics/angular', 'ng-new', {
    name: 'installed-app',
    version,
    directory: '.',
    style: 'scss',
    skipInstall: true,
    skipGit: true,
  });
  return { runner, tree };
}

test('preserves non-UTF8 asset bytes without text decoding', async context => {
  const manifestPath = join(root, 'dist/schematics/starter/manifest.json');
  const original = readFileSync(manifestPath);
  const manifest = JSON.parse(original.toString());
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe, 0x00, 0x80]);
  const file = 'public/images/binary-probe.png';
  const destination = join(root, 'dist/schematics/starter/files', file);
  writeFileSync(destination, bytes);
  manifest.files.push({ path: file, sha256: createHash('sha256').update(bytes).digest('hex') });
  writeFileSync(manifestPath, JSON.stringify(manifest));
  context.after(() => {
    writeFileSync(manifestPath, original);
    rmSync(destination);
  });
  const { runner, tree } = await workspace();
  const installed = await runner.runSchematic('ng-add', { skipInstall: true }, tree);
  assert.deepEqual(installed.read('/' + file), bytes);
});

test('installs starter code and direct dependencies without demo assets', async () => {
  const { runner, tree } = await workspace();
  const original = tree.readContent('/src/app/app.ts');
  const result = await runner.runSchematic('ng-add', { skipInstall: true }, tree);
  assert.ok(result.readContent('/src/app/app.ts').includes("signal('installed-app')"));
  assert.ok(original.includes("signal('installed-app')"));
  assert.match(
    result.readContent('/src/app/app.config.ts'),
    /provideHttpClient\(withInterceptors\(httpInterceptors\)\)/
  );
  assert.match(result.readContent('/src/app/app.routes.ts'), /routes\/dashboard/);
  assert.doesNotMatch(result.readContent('/src/app/app.routes.ts'), /routes\/material/);
  assert.ok(result.exists('/src/app/core/auth/auth-store.ts'));
  assert.deepEqual(
    result.read('/public/images/logo.svg'),
    readFileSync(join(root, 'public/images/logo.svg'))
  );
  assert.ok(!result.exists('/src/app/routes/material/material.routes.ts'));
  assert.ok(!result.exists('/public/images/pixabay/1.jpg'));
  const packageJson = JSON.parse(result.readContent('/package.json'));
  assert.ok(packageJson.dependencies['@angular/material']);
  assert.ok(!packageJson.dependencies['@ng-matero/extensions']);
  assert.equal(runner.tasks.length, 0);
});

test('preserves custom Sass imports and unrelated replacements, and installs public assets', async () => {
  const { runner, tree } = await workspace();
  tree.overwrite('/src/styles.scss', "@use 'sass:math';\n.custom { width: math.div(4px, 2); }\n");
  const config = new JSONFile(tree, 'angular.json');
  const target = ['projects', 'installed-app', 'architect', 'build'];
  config.modify([...target, 'options', 'assets'], []);
  const custom = { replace: 'src/other.ts', with: 'src/other.dev.ts' };
  config.modify([...target, 'configurations', 'development', 'fileReplacements'], [custom]);
  const result = await runner.runSchematic('ng-add', { skipInstall: true }, tree);
  const styles = result.readContent('/src/styles.scss');
  assert.ok(styles.indexOf("@use 'sass:math'") < styles.indexOf('html {'));
  const toastPackage = require('@ngxpert/hot-toast/package.json');
  assert.match(
    sass.compileString(styles, {
      loadPaths: [join(root, 'src'), join(root, 'node_modules')],
      quietDeps: true,
      importers: [
        {
          findFileUrl: url =>
            url === '@ngxpert/hot-toast/styles'
              ? pathToFileURL(
                  join(
                    dirname(require.resolve('@ngxpert/hot-toast/package.json')),
                    toastPackage.exports['./styles'].sass
                  )
                )
              : null,
        },
      ],
    }).css,
    /width: 2px/
  );
  const updated = JSON.parse(result.readContent('/angular.json')).projects['installed-app']
    .architect.build;
  assert.deepEqual(updated.options.assets, [{ glob: '**/*', input: 'public' }]);
  assert.deepEqual(updated.configurations.development.fileReplacements[0], custom);
});

test('refuses reserved aliases and existing lint configuration without erasing them', async () => {
  for (const conflict of ['alias', 'lint']) {
    const { runner, tree } = await workspace();
    if (conflict === 'alias')
      new JSONFile(tree, 'tsconfig.app.json').modify(
        ['compilerOptions', 'paths', '@core'],
        ['./keep/core']
      );
    else
      new JSONFile(tree, 'angular.json').modify(
        ['projects', 'installed-app', 'architect', 'lint'],
        { builder: 'custom:lint' }
      );
    const before = tree.readContent(conflict === 'alias' ? '/tsconfig.app.json' : '/angular.json');
    await assert.rejects(
      runner.runSchematic('ng-add', { skipInstall: true }, tree),
      /Refusing to replace/
    );
    assert.equal(
      tree.readContent(conflict === 'alias' ? '/tsconfig.app.json' : '/angular.json'),
      before
    );
  }
});

test('generates standalone lazy modules and pages before the wildcard with flat translation keys', async () => {
  const { runner, tree } = await workspace();
  const installed = await runner.runSchematic('ng-add', { skipInstall: true }, tree);
  const group = await runner.runSchematic('module', { name: 'orders' }, installed);
  const result = await runner.runSchematic('page', { name: 'list', module: 'orders' }, group);
  const routes = result.readContent('/src/app/app.routes.ts');
  assert.ok(routes.indexOf("path: 'orders'") < routes.indexOf("path: '**'"));
  assert.match(result.readContent('/src/app/routes/orders/orders.routes.ts'), /loadComponent/);
  assert.match(
    result.readContent('/src/app/routes/orders/list/list.ts'),
    /imports: \[PageHeader\]/
  );
  assert.match(
    result.readContent('/src/app/routes/orders/list/list.spec.ts'),
    /providers: \[provideRouter/
  );
  assert.doesNotMatch(
    result.readContent('/src/app/routes/orders/list/list.ts'),
    /NgModule|standalone: true|OnPush/
  );
  for (const language of ['en-US', 'zh-CN', 'zh-TW']) {
    const dictionary = JSON.parse(result.readContent(`/public/i18n/${language}.json`));
    assert.equal(dictionary.menu.orders, 'Orders');
    assert.equal(dictionary.menu['orders.list'], 'List');
  }
  const page = await runner.runSchematic('page', { name: 'reports' }, result);
  assert.match(page.readContent('/src/app/app.routes.ts'), /routes\/reports\/reports/);
  await assert.rejects(runner.runSchematic('page', { name: 'reports' }, page), /already exists/);
});

test('failed generation leaves every input file unchanged', async () => {
  for (const scenario of ['module', 'page', 'missing-module']) {
    const { runner, tree } = await workspace();
    const installed = await runner.runSchematic('ng-add', { skipInstall: true }, tree);
    if (scenario !== 'missing-module')
      new JSONFile(installed, '/public/i18n/zh-TW.json').modify(['menu', 'orders'], 'Keep');
    const before = new Map(installed.files.map(file => [file, installed.read(file)]));
    await assert.rejects(
      runner.runSchematic(
        scenario === 'module' ? 'module' : 'page',
        {
          name: 'orders',
          ...(scenario === 'missing-module' ? { module: 'missing' } : {}),
        },
        installed
      )
    );
    assert.deepEqual(installed.files, [...before.keys()]);
    for (const [file, content] of before) assert.deepEqual(installed.read(file), content, file);
  }
});

test('non-default settings configure DI and the pre-bootstrap defaults together', async () => {
  const { runner, tree } = await workspace();
  const result = await runner.runSchematic(
    'ng-add',
    { skipInstall: true, nav: 'top', theme: 'dark', dir: 'rtl', language: 'zh-TW' },
    tree
  );
  const config = result.readContent('/src/app/app.config.ts');
  assert.match(config, /provideAppSettings\(/);
  assert.match(config, /"navPos":"top"/);
  assert.match(config, /"dir":"rtl"/);
  assert.match(
    result.readContent('/src/index.html'),
    /const defaults = \{"theme":"dark","dir":"rtl","language":"zh-TW"\};/
  );
  assert.match(result.readContent('/src/index.spec.ts'), /baseAppSettings/);
});

test('refuses modified root templates instead of erasing user content', async () => {
  const { runner, tree } = await workspace();
  tree.overwrite('/src/app/app.html', '<h1>My application</h1>');
  await assert.rejects(
    runner.runSchematic('ng-add', { skipInstall: true }, tree),
    /modified welcome template/
  );
  assert.equal(tree.readContent('/src/app/app.html'), '<h1>My application</h1>');
});

test('schedules Yarn dependency installation unless explicitly skipped', async () => {
  const { runner, tree } = await workspace();
  await runner.runSchematic('ng-add', {}, tree);
  assert.equal(runner.tasks.filter(task => task.name === 'node-package').length, 1);
});

test('configures only the selected application with custom sourceRoot in a multi-project workspace', async () => {
  const { runner, tree: initial } = await workspace();
  const tree = await runner.runExternalSchematic(
    '@schematics/angular',
    'application',
    { name: 'second', projectRoot: 'projects/second', style: 'scss' },
    initial
  );
  const originalApp = tree.readContent('/src/app/app.ts');
  const originalConfig = tree.readContent('/tsconfig.app.json');
  for (const file of [...tree.files].filter(path => path.startsWith('/projects/second/src/'))) {
    tree.rename(file, file.replace('/projects/second/src/', '/projects/second/frontend/'));
  }
  const angular = JSON.parse(tree.readContent('/angular.json'));
  angular.projects.second.sourceRoot = 'projects/second/frontend';
  const build = angular.projects.second.architect.build.options;
  build.browser = 'projects/second/frontend/main.ts';
  build.styles = ['projects/second/frontend/styles.scss'];
  tree.overwrite('/angular.json', JSON.stringify(angular));
  for (const filename of ['tsconfig.app.json', 'tsconfig.spec.json']) {
    new JSONFile(tree, '/projects/second/' + filename).modify(['include'], ['frontend/**/*.ts']);
  }
  await assert.rejects(runner.runSchematic('ng-add', { skipInstall: true }, tree), /--project/);
  const result = await runner.runSchematic(
    'ng-add',
    { skipInstall: true, project: 'second' },
    tree
  );
  assert.equal(result.readContent('/src/app/app.ts'), originalApp);
  assert.equal(result.readContent('/tsconfig.app.json'), originalConfig);
  assert.ok(result.exists('/projects/second/frontend/app/core/auth/auth-store.ts'));
  assert.match(
    result.readContent('/projects/second/frontend/index.spec.ts'),
    /'\.\.\/public\/i18n\/en-US.json'/
  );
  const aliases = ts.parseConfigFileTextToJson(
    'tsconfig.app.json',
    result.readContent('/projects/second/tsconfig.app.json')
  ).config.compilerOptions.paths;
  assert.deepEqual(aliases['@core'], ['./frontend/app/core']);
  assert.ok(result.exists('/projects/second/public/images/logo.svg'));
  assert.deepEqual(JSON.parse(result.readContent('/projects/second/.stylelintrc')).ignoreFiles, [
    'dist/**',
    'coverage/**',
    'frontend/styles.scss',
  ]);
  assert.match(
    result.readContent('/projects/second/eslint.config.js'),
    /project: \['\.\/tsconfig.app.json', '\.\/tsconfig.spec.json'\]/
  );
});
