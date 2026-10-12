/**
 * Exercise a local tarball through the real CLI and compile the resulting fresh application.
 * How this file was built: written with Node's filesystem/process APIs (no tool generator).
 * Why: virtual schematic tests do not establish that installed packages build, test and lint.
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import assert from 'node:assert/strict';
import { format } from 'prettier';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectStarter, repositoryRoot } from './pack-starter.mjs';

const temporary = mkdtempSync(join(tmpdir(), 'ng-scaffold-golden-'));
const archive = join(temporary, 'ng-scaffold-' + temporary.split('-').at(-1) + '.tgz');
const environment = { ...process.env, NG_CLI_ANALYTICS: 'false', CI: 'true' };
const cases = [
  { name: 'default', settings: [], project: 'ng-scaffold', source: 'src', publicRoot: 'public' },
  {
    name: 'configured',
    settings: ['--nav=top', '--theme=dark', '--dir=rtl', '--language=zh-TW'],
    project: 'ng-scaffold',
    source: 'src',
    publicRoot: 'public',
  },
  {
    name: 'multi',
    settings: ['--project=second'],
    project: 'second',
    source: 'projects/second/frontend',
    publicRoot: 'projects/second/public',
  },
];
function read(directory, file) {
  return readFileSync(join(directory, file), 'utf8');
}
function run(directory, args) {
  process.stdout.write(`== ${args.join(' ')}\n`);
  execFileSync('yarn', args, { cwd: directory, env: environment, stdio: 'inherit' });
}

process.stdout.write(`Golden workspace: ${temporary}\n`);
run(repositoryRoot, ['-s', 'schematics:package']);
const artifactPath = join(repositoryRoot, 'dist/schematics/package.json');
const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
artifact.version = '0.0.0-golden.' + temporary.split('-').at(-1).toLowerCase();
writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
run(join(repositoryRoot, 'dist/schematics'), ['pack', '--filename', archive]);
const cli = join(temporary, 'cli');
cpSync(join(repositoryRoot, 'node_modules/@angular/cli'), cli, { recursive: true });
symlinkSync(join(repositoryRoot, 'node_modules'), join(temporary, 'node_modules'));
for (const fixture of cases)
  execFileSync(
    process.execPath,
    [
      join(cli, 'bin/ng.js'),
      'new',
      'ng-scaffold',
      '--directory',
      fixture.name,
      '--style=scss',
      '--skip-install',
      '--skip-git',
      '--package-manager=yarn',
      '--interactive=false',
      '--ssr=false',
    ],
    { cwd: temporary, env: environment, stdio: 'inherit' }
  );
rmSync(join(temporary, 'node_modules'));
rmSync(cli, { recursive: true });
const { files } = await collectStarter();
const formatOptions = JSON.parse(read(repositoryRoot, '.prettierrc'));
const exceptions = new Set(['public/favicon.ico']);
for (const fixture of cases) {
  const application = join(temporary, fixture.name);
  writeFileSync(
    join(application, '.yarnrc'),
    '--install.offline true\n--install.ignore-scripts true\n--add.offline true\n--add.ignore-scripts true\n'
  );
  run(application, ['install', '--offline', '--ignore-scripts']);
  let preserved;
  if (fixture.name === 'multi') {
    run(application, [
      '-s',
      'ng',
      'generate',
      'application',
      'second',
      '--project-root=projects/second',
      '--style=scss',
      '--skip-install',
      '--interactive=false',
      '--ssr=false',
    ]);
    renameSync(join(application, 'projects/second/src'), join(application, fixture.source));
    const workspace = JSON.parse(read(application, 'angular.json'));
    const project = workspace.projects.second;
    project.sourceRoot = fixture.source;
    project.architect.build.options.browser = fixture.source + '/main.ts';
    project.architect.build.options.styles = [fixture.source + '/styles.scss'];
    writeFileSync(join(application, 'angular.json'), JSON.stringify(workspace, null, 2));
    for (const file of ['tsconfig.app.json', 'tsconfig.spec.json']) {
      const path = 'projects/second/' + file;
      writeFileSync(
        join(application, path),
        read(application, path).replaceAll('src/', 'frontend/')
      );
    }
    preserved = ['src/app/app.ts', 'tsconfig.app.json', 'tsconfig.spec.json'].map(file => [
      file,
      read(application, file),
    ]);
  }
  run(application, [
    '-s',
    'ng',
    'add',
    archive,
    '--skip-confirmation',
    '--interactive=false',
    '--skip-install',
    ...fixture.settings,
  ]);
  run(application, ['install', '--offline', '--ignore-scripts']);
  const packageJson = JSON.parse(read(application, 'package.json'));
  assert.equal(
    JSON.parse(read(application, 'node_modules/ng-scaffold/package.json')).version,
    artifact.version
  );
  assert.ok(packageJson.devDependencies['ng-scaffold']);
  assert.ok(!packageJson.dependencies['ng-scaffold']);
  assert.ok(!packageJson.dependencies['@ng-matero/extensions']);
  for (const [file, originalExpected] of files) {
    if (exceptions.has(file)) continue;
    if (
      fixture.name === 'configured' &&
      ['src/app/app.config.ts', 'src/index.html', 'src/index.spec.ts'].includes(file)
    )
      continue;
    let expected = originalExpected;
    if (fixture.name === 'multi') {
      if (file === 'src/app/app.ts')
        expected = Buffer.from(
          expected.toString().replace("signal('ng-scaffold')", "signal('second')")
        );
      if (file === 'src/app/app.spec.ts')
        expected = Buffer.from(
          expected.toString().replace("toBe('ng-scaffold')", "toBe('second')")
        );
      if (file === 'src/index.html')
        expected = Buffer.from(
          expected.toString().replace('<title>NgScaffold</title>', '<title>Second</title>')
        );
    }
    const destination = file.startsWith('src/')
      ? fixture.source + '/' + file.slice(4)
      : fixture.publicRoot + '/' + file.slice(7);
    const actual = readFileSync(join(application, destination));
    if (/\.(ts|html|scss)$/.test(file)) {
      const canonical = async content =>
        await format(
          content
            .toString()
            .replace(
              '/* You can add global styles to this file, and also import other style files */',
              ''
            ),
          { ...formatOptions, filepath: file }
        );
      assert.equal(
        await canonical(actual),
        await canonical(expected),
        `Source parity: ${fixture.name}/${file}`
      );
    } else assert.deepEqual(actual, expected, `Asset parity: ${fixture.name}/${file}`);
  }
  if (preserved)
    for (const [file, original] of preserved)
      assert.equal(read(application, file), original, `Other application unchanged: ${file}`);
  if (fixture.name === 'configured') {
    const index = read(application, fixture.source + '/index.html');
    assert.match(index, /theme: 'dark'/);
    assert.match(index, /dir: 'rtl'/);
    assert.match(read(application, fixture.source + '/app/app.config.ts'), /provideAppSettings/);
  }
  const routes = read(application, fixture.source + '/app/app.routes.ts');
  assert.match(routes, /routes\/dashboard/);
  assert.doesNotMatch(routes, /routes\/material|routes\/forms/);
  run(application, ['-s', 'ng', 'lint', fixture.project]);
  run(application, ['-s', 'lint:scss']);
  run(application, ['-s', 'ng', 'test', fixture.project, '--watch=false']);
  run(application, ['-s', 'ng', 'build', fixture.project]);
  run(application, [
    '-s',
    'ng',
    'generate',
    'ng-scaffold:module',
    'orders',
    '--project=' + fixture.project,
  ]);
  run(application, [
    '-s',
    'ng',
    'generate',
    'ng-scaffold:page',
    'list',
    '--module=orders',
    '--project=' + fixture.project,
  ]);
  run(application, [
    '-s',
    'ng',
    'generate',
    'ng-scaffold:page',
    'reports',
    '--project=' + fixture.project,
  ]);
  run(application, ['-s', 'ng', 'lint', fixture.project]);
  run(application, ['-s', 'ng', 'test', fixture.project, '--watch=false']);
  run(application, ['-s', 'ng', 'build', fixture.project]);
  process.stdout.write(`== GOLDEN ${fixture.name} OK\n`);
}
rmSync(temporary, { recursive: true });
process.stdout.write('== GOLDEN OK\n');
