import nodePath from 'node:path';

import type { TAnchoredOutcome } from './_session@shared/_types/anchored-outcome.type.js';
import type { TSessionMemo, TSessionQuery } from './session.type.js';

import { hasMatchingFileFingerprints } from './_adapters/match-file-fingerprints/index.js';
import { readFileFingerprints } from './_adapters/read-file-fingerprints/index.js';
import { readSourceOverlay } from './_adapters/read-source-overlay/index.js';
import { verifyProject } from './_services/verify-project/index.js';
import { readModuleRecordCache } from './_session@shared/_adapters/read-module-record-cache/index.js';
import { writeModuleRecordCache } from './_session@shared/_adapters/write-module-record-cache/index.js';
import { moduleRecordStore } from './_session@shared/_stores/module-record-store/index.js';

export const session = (() => {
  const memos = new Map<string, TSessionMemo>();
  let activeConfigPath: null | string = null;

  const outcomesForFile = (
    byFile: ReadonlyMap<string, readonly TAnchoredOutcome[]>,
    filename: string
  ): readonly TAnchoredOutcome[] =>
    byFile.get(nodePath.resolve(filename)) ?? [];

  const loadRecordCache = (
    configPath: string,
    packageVersion: string
  ): void => {
    if (activeConfigPath !== configPath) {
      moduleRecordStore.clear();
      moduleRecordStore.setPersistentEntries(
        readModuleRecordCache({
          baseDirectory: nodePath.dirname(configPath),
          packageVersion,
        })
      );
      activeConfigPath = configPath;
      return;
    }
    moduleRecordStore.setPersistentEntries(
      readModuleRecordCache({
        baseDirectory: nodePath.dirname(configPath),
        packageVersion,
      })
    );
  };

  const verifyFresh = (
    query: TSessionQuery,
    configPath: string,
    overlayKey: string,
    overlayText: null | string
  ): readonly TAnchoredOutcome[] => {
    loadRecordCache(configPath, query.packageVersion);
    const fileOverlays = new Map<string, string>();
    if (overlayText !== null) {
      fileOverlays.set(nodePath.resolve(query.filename), overlayText);
    }
    const result = verifyProject({
      configPath,
      fileOverlays,
      workingDirectory: query.workingDirectory,
    });
    writeModuleRecordCache({
      baseDirectory: nodePath.dirname(configPath),
      entries: moduleRecordStore.getAllEntries(),
      packageVersion: query.packageVersion,
    });
    const watchedFiles = [
      configPath,
      ...result.loadedFiles,
      nodePath.resolve(result.baseDirectory, 'package.json'),
      ...result.externalFiles,
    ];
    const memo: TSessionMemo = {
      byFile: result.byFile,
      fingerprints: readFileFingerprints({
        treeOrigins: result.treeOrigins,
        watchedFiles,
      }),
      overrideKey: overlayKey,
      treeOrigins: result.treeOrigins,
      watchedFiles,
    };
    memos.set(configPath, memo);
    return outcomesForFile(memo.byFile, query.filename);
  };

  return {
    clearModuleRecords(): void {
      moduleRecordStore.clear();
      memos.clear();
      activeConfigPath = null;
    },

    outcomesFor(query: TSessionQuery): readonly TAnchoredOutcome[] {
      const configPath = nodePath.isAbsolute(query.configPath)
        ? query.configPath
        : nodePath.resolve(query.workingDirectory, query.configPath);
      const overlay = readSourceOverlay(query.filename, query.sourceText);
      const previous = memos.get(configPath);
      if (previous === undefined) {
        return verifyFresh(query, configPath, overlay.key, overlay.text);
      }
      const isUnchanged =
        previous.overrideKey === overlay.key &&
        hasMatchingFileFingerprints(previous.fingerprints, {
          treeOrigins: previous.treeOrigins,
          watchedFiles: previous.watchedFiles,
        });
      return isUnchanged
        ? outcomesForFile(previous.byFile, query.filename)
        : verifyFresh(query, configPath, overlay.key, overlay.text);
    },
  };
})();
