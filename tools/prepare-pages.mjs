/**
 * Prepare Angular's production output for static GitHub Pages deep links.
 * How this file was built: Node filesystem APIs; no deployment file generator exists.
 * Why: Pages serves 404.html for unknown routes while Angular handles the original URL.
 */
import { copyFile, lstat, realpath, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function preparePages(output = 'dist/ng-scaffold/browser') {
  const directory = resolve(output);
  if ((await realpath(directory)) !== directory) throw new Error('Refusing symlink output path');
  if (!(await lstat(directory)).isDirectory()) throw new Error('Expected a real output directory');
  for (const name of ['index.html', '404.html', '.nojekyll']) {
    const entry = await lstat(resolve(directory, name)).catch(error => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (entry && !entry.isFile()) throw new Error(`Refusing non-file output: ${name}`);
  }
  await copyFile(resolve(directory, 'index.html'), resolve(directory, '404.html'));
  await writeFile(resolve(directory, '.nojekyll'), '');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await preparePages(process.argv[2]);
}
