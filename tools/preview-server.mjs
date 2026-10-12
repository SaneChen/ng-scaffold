/**
 * Serve production assets under a Pages-style base path, including the static 404 fallback.
 * How this file was built: Node HTTP/filesystem APIs; no Angular CLI static-server generator.
 * Why: browser tests must exercise the actual build and deep links, not dev-server rewrites.
 */
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export async function previewServer(directory, basePath = '/ng-scaffold/') {
  const root = await realpath(directory);
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath)) throw new Error('Invalid preview base path');
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405).end();
        return;
      }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(basePath)) {
        response.writeHead(404).end();
        return;
      }
      let file = resolve(root, pathname.slice(basePath.length) || 'index.html');
      if (file !== root && !file.startsWith(root + sep)) {
        response.writeHead(404).end();
        return;
      }
      let status = 200;
      try {
        const actual = await realpath(file);
        if (!actual.startsWith(root + sep) || !(await stat(actual)).isFile())
          throw new Error('Not an asset');
        file = actual;
      } catch {
        if (extname(pathname)) {
          response.writeHead(404).end();
          return;
        }
        file = resolve(root, '404.html');
        const fallback = await realpath(file);
        if (!fallback.startsWith(root + sep) || !(await stat(fallback)).isFile())
          throw new Error('Unsafe fallback');
        file = fallback;
        status = 404;
      }
      const body = await readFile(file);
      response.writeHead(status, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(400).end();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await previewServer(
    process.argv[2] ?? 'dist/ng-scaffold/browser',
    process.argv[3] ?? '/ng-scaffold/'
  );
  server.listen(4173, '127.0.0.1', () =>
    process.stdout.write('Preview: http://127.0.0.1:4173/ng-scaffold/\n')
  );
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
