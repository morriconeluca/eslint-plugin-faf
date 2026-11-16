import type { TUnverifiedOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TImportResolution,
  TModuleCollection,
  TModuleRecord,
} from '../../_conformity@shared/_types/verification-model.type.js';
import type { TCollectModulesInput } from './collect-modules.type.js';

import { toPosixPath } from '../../../../_src@shared/_utils/to-posix-path/index.js';
import { assertInvariant } from '../../_conformity@shared/_utils/assert-invariant/index.js';
import { canonicalizeDirectory } from './_collect-modules@shared/_utils/canonicalize-directory/index.js';
import { moduleRecordStore } from './_stores/module-record-store/index.js';
import { analyzeQueuedModule } from './_utils/analyze-queued-module/index.js';
import { orderModuleCollection } from './_utils/order-module-collection/index.js';
import { produceModuleRecordByExtension } from './_utils/produce-module-record-by-extension/index.js';
import { resolveSpecifiers } from './_utils/resolve-specifiers/index.js';
import {
  collectUnvisitedLocalPaths,
  selectTreeFilePaths,
} from './collect-modules.util.js';

export function collectModules(input: TCollectModulesInput): TModuleCollection {
  const baseDirectory = canonicalizeDirectory(input.baseDirectory);
  moduleRecordStore.loadCache(baseDirectory, input.packageVersion);
  const producer = moduleRecordStore.wrapProducer(
    produceModuleRecordByExtension
  );
  const resolver = resolveSpecifiers(baseDirectory, input.aliases);
  const queue = [...selectTreeFilePaths(input.inventory)];
  const visited = new Set<string>(queue);
  for (const item of input.inventory.items) {
    const posix = toPosixPath(item.path);
    if (
      item.kind !== 'file' ||
      item.treeOrigin !== null ||
      visited.has(posix)
    ) {
      continue;
    }
    visited.add(posix);
    queue.push(posix);
  }
  const records = new Map<string, TModuleRecord>();
  const resolutions = new Map<string, readonly TImportResolution[]>();
  const unverifiedOutcomes: TUnverifiedOutcome[] = [];
  let cursor = 0;

  while (cursor < queue.length) {
    const relativePath = queue[cursor];
    assertInvariant(relativePath !== undefined, 'Expected queued module path');
    cursor += 1;
    const analysis = analyzeQueuedModule({
      baseDirectory,
      inventory: input.inventory,
      producer,
      relativePath,
      resolver,
      textOverrides: input.textOverrides,
    });
    if (analysis.record !== null) {
      records.set(relativePath, analysis.record);
      resolutions.set(relativePath, analysis.resolutions);
    }
    for (const outcome of analysis.outcomes) {
      unverifiedOutcomes.push(outcome);
    }
    for (const reachablePath of collectUnvisitedLocalPaths(
      analysis.resolutions,
      visited
    )) {
      visited.add(reachablePath);
      queue.push(reachablePath);
    }
  }

  moduleRecordStore.saveCache(baseDirectory, input.packageVersion);
  return orderModuleCollection({ records, resolutions, unverifiedOutcomes });
}
