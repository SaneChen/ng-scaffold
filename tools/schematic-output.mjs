/**
 * Clear only the schematic artifact, rejecting symlinked output paths before deletion.
 * How this file was built: Node filesystem APIs; no tool generator exists.
 * Why: stale compiled files must not leak into npm packs or cause deletion outside the repo.
 */
import { lstat, rm } from 'node:fs/promises';
import { join } from 'node:path';

export async function clearSchematicOutput(root) {
  const output = join(root, 'dist/schematics');
  for (const directory of [root, join(root, 'dist'), output]) {
    const entry = await lstat(directory).catch(error => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    if (entry && (entry.isSymbolicLink() || !entry.isDirectory()))
      throw new Error(`Expected a real output directory: ${directory}`);
  }
  await rm(output, { recursive: true, force: true });
  return output;
}
