import nodePath from 'node:path';

import type { TCollectExternalFilesInput } from './collect-external-files.type.js';

import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function collectExternalFiles(
  input: TCollectExternalFilesInput
): readonly string[] {
  const externalFilesSet = new Set<string>([
    nodePath.resolve(input.baseDirectory, 'package.json'),
  ]);

  for (const item of input.inventory.items) {
    if (item.kind === 'file' && item.treeOrigin === null) {
      externalFilesSet.add(nodePath.resolve(input.baseDirectory, item.path));
    }
  }

  for (const modulePath of input.modules.records.keys()) {
    const absolute = nodePath.resolve(input.baseDirectory, modulePath);
    const isUnderTree = input.treeOrigins.some(
      (origin) =>
        absolute === origin || absolute.startsWith(`${origin}${nodePath.sep}`)
    );
    if (!isUnderTree) {
      externalFilesSet.add(absolute);
    }
  }

  const externalFiles = [...externalFilesSet];
  externalFiles.sort(compareOrdinal);
  return externalFiles;
}
