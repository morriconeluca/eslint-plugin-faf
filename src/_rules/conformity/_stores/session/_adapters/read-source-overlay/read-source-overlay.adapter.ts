import nodePath from 'node:path';

import type { TSourceOverlay } from './read-source-overlay.type.js';

import { readFileSnapshot } from '../../_session@shared/_adapters/read-file-snapshot/index.js';

export function readSourceOverlay(
  filename: string,
  sourceText: string
): TSourceOverlay {
  const absolute = nodePath.resolve(filename);
  const snapshot = readFileSnapshot(absolute);
  return snapshot.present && snapshot.text === sourceText
    ? { key: '', text: null }
    : { key: `${absolute}\0${sourceText}`, text: sourceText };
}
