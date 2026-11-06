import type { TUnverifiedOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TModuleRecord } from '../../../../_session@shared/_types/module-record.type.js';
import type { TModuleCollection } from '../../_verify-project@shared/_types/_aggregates/module-collection.type.js';
import type { TImportResolution } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TCollectModulesInput } from './collect-modules.type.js';

import { moduleRecordStore } from '../../../../_session@shared/_stores/module-record-store/index.js';
import { toPosixPath } from '../../../../_session@shared/_utils/to-posix-path/index.js';
import { assertInvariant } from '../../_verify-project@shared/_utils/assert-invariant/index.js';
import { analyzeQueuedModule } from './_adapters/analyze-queued-module/index.js';
import { resolveSpecifiers } from './_adapters/resolve-specifiers/index.js';
import { canonicalizeDirectory } from './_collect-modules@shared/_adapters/canonicalize-directory/index.js';
import { collectUnvisitedLocalPaths } from './_utils/collect-unvisited-local-paths/index.js';
import { orderModuleCollection } from './_utils/order-module-collection/index.js';
import { produceModuleRecordByExtension } from './_utils/produce-module-record-by-extension/index.js';
import { selectTreeFilePaths } from './_utils/select-tree-file-paths/index.js';

export function collectModules(input: TCollectModulesInput): TModuleCollection {
  const baseDirectory = canonicalizeDirectory(input.baseDirectory);
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

  return orderModuleCollection({ records, resolutions, unverifiedOutcomes });
}
