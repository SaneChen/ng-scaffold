/**
 * Collect the starter directly from repository sources, without duplicate templates.
 * How this file was built: written by hand; Angular CLI has no repository packaging generator.
 * Why: demo exclusions and source hashes must be testable before implementing ng-add.
 */
import { createHash } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const starterRoutes = ['dashboard', 'sessions', 'profile'];
export const runtimeDependencies = [
  '@angular/cdk',
  '@angular/material',
  '@fontsource/roboto',
  '@fontsource/material-symbols-outlined',
  '@ngx-translate/core',
  '@ngx-translate/http-loader',
  '@ngxpert/hot-toast',
  '@ngneat/overview',
  'chart.js',
];

export const developmentDependencies = [
  '@angular-eslint/builder',
  'angular-eslint',
  '@eslint/js',
  'eslint',
  'typescript-eslint',
  'stylelint',
  'stylelint-config-recess-order',
  'stylelint-config-recommended-scss',
  'stylelint-config-standard',
  'stylelint-order',
  'prettier',
];
export const configurationFiles = ['eslint.config.js', '.stylelintrc', '.prettierrc'];

export function isStarterPath(path) {
  if (path.startsWith('src/app/routes/')) {
    return starterRoutes.includes(path.split('/')[3]);
  }
  if (path.startsWith('src/app/theme/widgets/github-button/')) return false;
  if (path === 'src/styles/plugins/_photoviewer.scss') return false;
  if (path === 'src/styles/plugins/_demo-overlays.scss') return false;
  if (path.startsWith('src/')) return true;
  if (path === 'public/data/menu.json' || path === 'public/favicon.ico') return true;
  if (/^public\/i18n\/(en-US|zh-CN|zh-TW)\.json$/.test(path)) return true;
  return (
    path.startsWith('public/images/') &&
    !path.startsWith('public/images/pixabay/') &&
    !path.startsWith('public/images/demo/')
  );
}

export function stripDemoFences(source, path = 'source') {
  let depth = 0;
  const lines = [];
  for (const line of source.split('\n')) {
    const marker = /^\s*(?:\/\/|<!--)\s*<(\/?)demo>\s*(?:-->)?\s*$/.exec(line);
    if (marker) {
      depth += marker[1] ? -1 : 1;
      if (depth < 0) throw new Error(`Unmatched demo closing fence: ${path}`);
    } else if (depth === 0) {
      lines.push(line);
    }
  }
  if (depth !== 0) throw new Error(`Unclosed demo fence: ${path}`);
  return lines.join('\n');
}

export function filterStarterMenu(source) {
  const data = JSON.parse(source);
  if (!Array.isArray(data.menu)) throw new Error('Expected a menu array');
  return (
    JSON.stringify(
      { ...data, menu: data.menu.filter(item => starterRoutes.includes(item.name)) },
      null,
      2
    ) + '\n'
  );
}

async function checkDirectory(path, allowMissing = false) {
  let entry;
  try {
    entry = await lstat(path);
  } catch (error) {
    if (allowMissing && error.code === 'ENOENT') return;
    throw error;
  }
  if (entry.isSymbolicLink() || !entry.isDirectory()) {
    throw new Error(`Expected a real directory, not a symlink: ${path}`);
  }
}

async function walk(root, directory) {
  await checkDirectory(join(root, directory));
  const files = [];
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Source symlinks are not supported: ${path}`);
    if (entry.isDirectory()) files.push(...(await walk(root, path)));
    else if (entry.isFile() && isStarterPath(path)) files.push(path);
  }
  return files.sort();
}

export async function collectStarter(root = repositoryRoot) {
  await checkDirectory(root);
  const files = new Map();
  for (const path of [...(await walk(root, 'src')), ...(await walk(root, 'public'))].sort()) {
    let content = await readFile(join(root, path));
    if (/\.(?:ts|html|scss)$/.test(path)) {
      content = Buffer.from(stripDemoFences(content.toString('utf8'), path));
    }
    if (path === 'public/data/menu.json') {
      content = Buffer.from(filterStarterMenu(content.toString('utf8')));
    }
    files.set(path, content);
  }
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const dependencies = Object.fromEntries(
    runtimeDependencies.map(name => {
      const version = packageJson.dependencies?.[name];
      if (typeof version !== 'string') throw new Error(`Missing starter dependency: ${name}`);
      return [name, version];
    })
  );
  return {
    files,
    manifest: {
      version: 1,
      dependencies,
      developmentDependencies: Object.fromEntries(
        developmentDependencies
          .map(name => [name, packageJson.devDependencies?.[name]])
          .filter(([, version]) => typeof version === 'string')
      ),
      files: Array.from(files, ([path, content]) => ({
        path,
        sha256: createHash('sha256').update(content).digest('hex'),
      })),
    },
  };
}

export async function packStarter(root = repositoryRoot) {
  const destination = join(root, 'dist/starter');
  const { files, manifest } = await collectStarter(root);
  await checkDirectory(join(root, 'dist'), true);
  await checkDirectory(destination, true);
  await rm(destination, { recursive: true, force: true });
  for (const [path, content] of files) {
    const output = join(destination, 'files', path);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, content);
  }
  await mkdir(destination, { recursive: true });
  await writeFile(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { destination, count: files.size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { destination, count } = await packStarter();
  process.stdout.write(`Starter: ${count} files → ${relative(repositoryRoot, destination)}\n`);
}
