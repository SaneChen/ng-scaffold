/**
 * Regression tests for destructive artifact cleanup boundaries.
 * How this file was built: Node's test runner; no tool-spec generator exists.
 * Why: rebuilding must remove stale outputs without touching other builds or symlink targets.
 */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { clearSchematicOutput } from './schematic-output.mjs';

test('clears stale compiled files but preserves application builds', async context => {
  const root = await mkdtemp(join(tmpdir(), 'ng-scaffold-output-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'dist/schematics'), { recursive: true });
  await mkdir(join(root, 'dist/application'));
  await writeFile(join(root, 'dist/schematics/stale.js'), 'obsolete');
  await writeFile(join(root, 'dist/application/sentinel'), 'keep');
  await clearSchematicOutput(root);
  await assert.rejects(readFile(join(root, 'dist/schematics/stale.js')), { code: 'ENOENT' });
  assert.equal(await readFile(join(root, 'dist/application/sentinel'), 'utf8'), 'keep');
});

test('rejects output symlinks without deleting their target', async context => {
  const parent = await mkdtemp(join(tmpdir(), 'ng-scaffold-output-'));
  context.after(() => rm(parent, { recursive: true, force: true }));
  const root = join(parent, 'repo');
  const external = join(parent, 'external');
  await mkdir(root);
  await mkdir(external);
  await writeFile(join(external, 'sentinel'), 'keep');
  await symlink(external, join(root, 'dist'));
  await assert.rejects(clearSchematicOutput(root), /real output directory/);
  await rm(join(root, 'dist'));
  await mkdir(join(root, 'dist'));
  await symlink(external, join(root, 'dist/schematics'));
  await assert.rejects(clearSchematicOutput(root), /real output directory/);
  assert.equal(await readFile(join(external, 'sentinel'), 'utf8'), 'keep');
});
