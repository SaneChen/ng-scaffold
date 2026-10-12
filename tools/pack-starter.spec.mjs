/**
 * Packaging regressions for the real source tree and malformed demo boundaries.
 * How this file was built: written with Node's test runner; no generator supports tool specs.
 * Why: a starter must not retain demo code, assets or runtime dependencies.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  collectStarter,
  filterStarterMenu,
  isStarterPath,
  packStarter,
  runtimeDependencies,
  stripDemoFences,
} from './pack-starter.mjs';

async function fixture(testContext) {
  const parent = await mkdtemp(join(tmpdir(), 'ng-scaffold-pack-'));
  testContext.after(() => rm(parent, { recursive: true, force: true }));
  const root = join(parent, 'repo');
  await mkdir(join(root, 'src'), { recursive: true });
  await mkdir(join(root, 'public/images'), { recursive: true });
  await writeFile(join(root, 'src/main.ts'), 'export {};\n');
  await writeFile(join(root, 'public/images/obsolete.svg'), 'test asset');
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      dependencies: Object.fromEntries(runtimeDependencies.map(name => [name, '1.0.0'])),
    })
  );
  return { parent, root };
}

test('rejects source root symlinks instead of collecting external files', async testContext => {
  const { parent, root } = await fixture(testContext);
  for (const directory of ['public', 'src']) {
    const external = join(parent, `external-${directory}`);
    await rename(join(root, directory), external);
    await symlink(external, join(root, directory));
    await assert.rejects(collectStarter(root), /not a symlink/);
    await rm(join(root, directory));
    await rename(external, join(root, directory));
  }
});

test('rejects symlinked output ancestors without deleting external data', async testContext => {
  const { parent, root } = await fixture(testContext);
  const external = join(parent, 'external');
  await mkdir(join(external, 'starter'), { recursive: true });
  const sentinel = join(external, 'starter/sentinel');
  await writeFile(sentinel, 'untouched');
  await symlink(external, join(root, 'dist'));
  await assert.rejects(packStarter(root), /not a symlink/);
  assert.equal(await readFile(sentinel, 'utf8'), 'untouched');
  await rm(join(root, 'dist'));
  await mkdir(join(root, 'dist'));
  await symlink(join(external, 'starter'), join(root, 'dist/starter'));
  await assert.rejects(packStarter(root), /not a symlink/);
  assert.equal(await readFile(sentinel, 'utf8'), 'untouched');
});

test('repacking removes stale starter output and preserves other build directories', async testContext => {
  const { root } = await fixture(testContext);
  await mkdir(join(root, 'dist/application'), { recursive: true });
  const sentinel = join(root, 'dist/application/sentinel');
  await writeFile(sentinel, 'untouched');
  await packStarter(root);
  const output = join(root, 'dist/starter/files/public/images/obsolete.svg');
  assert.equal(await readFile(output, 'utf8'), 'test asset');
  await rm(join(root, 'public/images/obsolete.svg'));
  await packStarter(root);
  await assert.rejects(readFile(output), { code: 'ENOENT' });
  assert.equal(await readFile(sentinel, 'utf8'), 'untouched');
});

test('strips TS, HTML and nested fences without changing surrounding lines', () => {
  assert.equal(
    stripDemoFences('before\n// <demo>\nhidden\n// </demo>\nafter\n'),
    'before\nafter\n'
  );
  assert.equal(stripDemoFences('<!-- <demo> -->\nhidden\n<!-- </demo> -->\nkept'), 'kept');
  assert.equal(
    stripDemoFences('// <demo>\n// <demo>\nhidden\n// </demo>\n// </demo>\nkept'),
    'kept'
  );
  assert.equal(stripDemoFences('<demo>Not a comment</demo>'), '<demo>Not a comment</demo>');
});

test('rejects unbalanced fences rather than silently dropping source', () => {
  assert.throws(() => stripDemoFences('// </demo>', 'file.ts'), /Unmatched.*file.ts/);
  assert.throws(() => stripDemoFences('// <demo>', 'file.ts'), /Unclosed.*file.ts/);
});

test('includes starter routes and assets but no demo regions or tooling state', () => {
  for (const path of [
    'src/app/routes/dashboard/dashboard.ts',
    'src/app/routes/profile/settings/settings.ts',
    'public/images/logo.svg',
    'public/i18n/zh-CN.json',
  ]) {
    assert.equal(isStarterPath(path), true, path);
  }
  for (const path of [
    'src/app/routes/demo/demo-dates.ts',
    'src/app/routes/forms/forms.routes.ts',
    'src/app/theme/widgets/github-button/github-button.ts',
    'src/styles/plugins/_photoviewer.scss',
    'public/images/demo/neptune.svg',
    'public/images/pixabay/1.jpg',
    'public/i18n/demo/en-US.json',
    'public/data/demo/repos.json',
    '.codex/config.toml',
  ]) {
    assert.equal(isStarterPath(path), false, path);
  }
});

test('filters demo menu entries while preserving starter entries and metadata', () => {
  const dashboard = { name: 'dashboard', route: 'dashboard', permissions: { only: 'ADMIN' } };
  const result = JSON.parse(
    filterStarterMenu(
      JSON.stringify({
        menu: [dashboard, { name: 'forms' }, { name: 'sessions' }],
        metadata: 'kept',
      })
    )
  );
  assert.deepEqual(result, { menu: [dashboard, { name: 'sessions' }], metadata: 'kept' });
  assert.throws(() => filterStarterMenu('{}'), /menu array/);
});

test('collects deterministic sources, strips actual registrations and checksums every file', async () => {
  const first = await collectStarter();
  const second = await collectStarter();
  assert.deepEqual(first.manifest, second.manifest);
  assert.ok(first.files.size > 100);
  const routes = first.files.get('src/app/app.routes.ts').toString();
  assert.match(routes, /routes\/dashboard/);
  assert.doesNotMatch(routes, /import\('\.\/routes\/(material|forms|demo|design)/);
  assert.doesNotMatch(
    first.files.get('src/app/theme/index.ts').toString(),
    /export.*github-button/
  );
  assert.doesNotMatch(
    first.files.get('src/app/theme/header/header.html').toString(),
    /<app-github-button/
  );
  assert.doesNotMatch(
    first.files.get('src/styles/plugins/_index.scss').toString(),
    /@use.*(photoviewer|demo-overlays)/
  );
  assert.deepEqual(Object.keys(first.manifest.dependencies), runtimeDependencies);
  for (const { path, sha256 } of first.manifest.files) {
    assert.equal(sha256, createHash('sha256').update(first.files.get(path)).digest('hex'));
    assert.ok(isStarterPath(path), path);
  }
  assert.deepEqual(
    JSON.parse(first.files.get('public/data/menu.json').toString()).menu.map(item => item.name),
    ['dashboard', 'profile', 'sessions']
  );
});
