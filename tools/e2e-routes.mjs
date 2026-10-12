/**
 * Write the route scan inventory from current Angular sources before Playwright discovery.
 * How this file was built: Node filesystem, TypeScript transpilation and VM loading; no tool generator.
 * Why: the inventory is a generated test artifact, not a second maintained route definition.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const module = { exports: {} };
const compiled = ts.transpileModule(readFileSync('e2e/routes.ts', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
runInNewContext(compiled, {
  module,
  exports: module.exports,
  require: createRequire(import.meta.url),
});
export const routePaths = module.exports.routePaths;
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const routes = routePaths(file => readFileSync(file, 'utf8'));
  writeFileSync('e2e/route-inventory.json', JSON.stringify(routes, null, 2) + '\n');
  process.stdout.write(`Browser inventory: ${routes.length} routes\n`);
}
