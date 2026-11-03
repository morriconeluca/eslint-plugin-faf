import nodeFs from 'node:fs';
import nodePath from 'node:path';

export function canonicalizeDirectory(directory: string): string {
  const resolved = nodePath.resolve(directory);
  return nodeFs.existsSync(resolved) ? nodeFs.realpathSync(resolved) : resolved;
}
