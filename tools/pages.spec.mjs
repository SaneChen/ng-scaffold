/**
 * Validate static Pages preparation, fallback status and preview filesystem boundaries.
 * How this file was built: Node's test runner and temporary directories; no CLI generator.
 * Why: browser deep-link tests must not hide missing assets or serve files outside the build.
 */
import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { preparePages } from './prepare-pages.mjs';
import { previewServer } from './preview-server.mjs';

test('Pages output preserves index and serves genuine static fallback responses', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ng-pages-'));
  const server = await previewServer(directory);
  try {
    await writeFile(join(directory, 'index.html'), '<base href="/ng-scaffold/">');
    await writeFile(join(directory, 'styles.css'), 'body {}');
    await preparePages(directory);
    assert.equal(
      await readFile(join(directory, '404.html'), 'utf8'),
      await readFile(join(directory, 'index.html'), 'utf8')
    );
    assert.equal(await readFile(join(directory, '.nojekyll'), 'utf8'), '');
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const index = await fetch(base + '/ng-scaffold/');
    assert.equal(index.status, 200);
    const deep = await fetch(base + '/ng-scaffold/profile/settings');
    assert.equal(deep.status, 404);
    assert.match(await deep.text(), /base href/);
    const asset = await fetch(base + '/ng-scaffold/styles.css');
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /text\/css/);
    assert.equal((await fetch(base + '/ng-scaffold/missing.js')).status, 404);
    assert.equal((await fetch(base + '/outside')).status, 404);
    assert.equal((await fetch(base + '/ng-scaffold/%2e%2e%2fsecret')).status, 404);
    assert.equal((await fetch(base + '/ng-scaffold/%FF')).status, 400);
    assert.equal((await fetch(base + '/ng-scaffold/', { method: 'POST' })).status, 405);
    assert.equal(await (await fetch(base + '/ng-scaffold/', { method: 'HEAD' })).text(), '');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('Pages preparation rejects output and asset symlinks including linked ancestors', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ng-pages-links-'));
  try {
    await mkdir(join(directory, 'actual'));
    await mkdir(join(directory, 'actual', 'browser'));
    await writeFile(join(directory, 'actual', 'browser', 'index.html'), 'safe');
    await symlink(join(directory, 'actual'), join(directory, 'linked'));
    await assert.rejects(preparePages(join(directory, 'linked', 'browser')), /symlink/);
    await symlink(
      join(directory, 'actual', 'browser', 'index.html'),
      join(directory, 'actual', 'browser', '404.html')
    );
    await assert.rejects(preparePages(join(directory, 'actual', 'browser')), /non-file/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Preview refuses assets and fallback symlinks that escape the build', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ng-pages-escape-'));
  const build = join(directory, 'build');
  await mkdir(build);
  await writeFile(join(directory, 'secret.html'), 'secret');
  await symlink(join(directory, 'secret.html'), join(build, '404.html'));
  await symlink(join(directory, 'secret.html'), join(build, 'escape.html'));
  const server = await previewServer(build);
  try {
    await assert.rejects(previewServer(build, '/bad//'), /Invalid/);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/ng-scaffold/`;
    assert.equal((await fetch(base + 'escape.html')).status, 404);
    const fallback = await fetch(base + 'unknown');
    assert.equal(fallback.status, 400);
    assert.notEqual(await fallback.text(), 'secret');
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
