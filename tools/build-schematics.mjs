/**
 * Assemble the compiled schematics and source-derived starter into one publishable directory.
 * How this file was built: written by hand; no Angular CLI packaging generator exists.
 * Why: the npm artifact must contain all templates without a separately maintained copy.
 */
import { cp, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { packStarter, repositoryRoot, configurationFiles } from './pack-starter.mjs';
import { clearSchematicOutput } from './schematic-output.mjs';

const { destination } = await packStarter();
const output = await clearSchematicOutput(repositoryRoot);
execFileSync(
  process.execPath,
  [join(repositoryRoot, 'node_modules/typescript/bin/tsc'), '-p', 'schematics/tsconfig.json'],
  { cwd: repositoryRoot, stdio: 'inherit' }
);
await mkdir(output, { recursive: true });
await cp(destination, join(output, 'starter'), { recursive: true });
await mkdir(join(output, 'starter/baseline'), { recursive: true });
for (const path of ['app.html', 'app.spec.ts']) {
  await writeFile(
    join(output, 'starter/baseline', path),
    execFileSync('git', ['show', `0d99dd2:src/app/${path}`], { cwd: repositoryRoot })
  );
}
for (const path of configurationFiles) {
  if (!(await lstat(join(repositoryRoot, path))).isFile())
    throw new Error(`Expected a real configuration file: ${path}`);
  await cp(join(repositoryRoot, path), join(output, 'starter', path));
}
for (const path of [
  'collection.json',
  'migration.json',
  'ng-add/schema.json',
  'ng-generate/schema.json',
]) {
  await mkdir(join(output, path, '..'), { recursive: true });
  await cp(join(repositoryRoot, 'schematics', path), join(output, path));
}
const metadata = JSON.parse(
  await readFile(join(repositoryRoot, 'schematics/package.json'), 'utf8')
);
const manifest = JSON.parse(await readFile(join(destination, 'manifest.json'), 'utf8'));
metadata.dependencies = { ...metadata.dependencies, ...manifest.dependencies };
await writeFile(join(output, 'package.json'), JSON.stringify(metadata, null, 2) + '\n');
await cp(join(repositoryRoot, 'LICENSE'), join(output, 'LICENSE'));
await cp(join(repositoryRoot, 'schematics/README.md'), join(output, 'README.md'));
process.stdout.write('Schematic package: dist/schematics\n');
