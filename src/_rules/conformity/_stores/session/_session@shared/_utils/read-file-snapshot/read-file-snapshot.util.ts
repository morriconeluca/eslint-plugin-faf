import nodeFs from 'node:fs';

import type { TFileSnapshot } from './read-file-snapshot.type.js';

export function readFileSnapshot(filePath: string): TFileSnapshot {
  try {
    const text = nodeFs.readFileSync(filePath, 'utf8');
    const stats = nodeFs.statSync(filePath);
    return {
      mtimeMs: stats.mtimeMs,
      present: true,
      size: stats.size,
      text,
    };
  } catch {
    return { present: false };
  }
}
