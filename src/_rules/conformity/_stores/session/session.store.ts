import nodePath from 'node:path';

import type { TAnchoredOutcome } from '../../_conformity@shared/_types/anchored-outcome.type.js';
import type {
  TSessionLookupResult,
  TSessionMemo,
  TSessionQuery,
  TSessionSaveInput,
} from './session.type.js';

import { hasMatchingFileFingerprints } from './_utils/match-file-fingerprints/index.js';
import { readFileFingerprints } from './_utils/read-file-fingerprints/index.js';
import { readSourceOverlay } from './_utils/read-source-overlay/index.js';

export const session = (() => {
  const memos = new Map<string, TSessionMemo>();

  const outcomesForFile = (
    byFile: ReadonlyMap<string, readonly TAnchoredOutcome[]>,
    filename: string
  ): readonly TAnchoredOutcome[] =>
    byFile.get(nodePath.resolve(filename)) ?? [];

  return {
    clear(): void {
      memos.clear();
    },

    lookup(query: TSessionQuery): TSessionLookupResult {
      const configPath = nodePath.isAbsolute(query.configPath)
        ? query.configPath
        : nodePath.resolve(query.workingDirectory, query.configPath);
      const overlay = readSourceOverlay(query.filename, query.sourceText);
      const previous = memos.get(configPath);
      const isUnchanged =
        previous !== undefined &&
        previous.overrideKey === overlay.key &&
        hasMatchingFileFingerprints(previous.fingerprints, {
          treeOrigins: previous.treeOrigins,
          watchedFiles: previous.watchedFiles,
        });
      return isUnchanged
        ? {
            hit: true,
            outcomes: outcomesForFile(previous.byFile, query.filename),
          }
        : {
            configPath,
            hit: false,
            overlayKey: overlay.key,
            overlayText: overlay.text,
          };
    },

    save(input: TSessionSaveInput): void {
      const watchedFiles = [
        input.configPath,
        ...input.loadedFiles,
        nodePath.resolve(input.baseDirectory, 'package.json'),
        ...input.externalFiles,
      ];
      memos.set(input.configPath, {
        byFile: input.byFile,
        fingerprints: readFileFingerprints({
          treeOrigins: input.treeOrigins,
          watchedFiles,
        }),
        overrideKey: input.overrideKey,
        treeOrigins: input.treeOrigins,
        watchedFiles,
      });
    },
  };
})();
