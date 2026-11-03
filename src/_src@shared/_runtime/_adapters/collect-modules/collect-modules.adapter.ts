import type { TUnverifiedOutcome } from '../../../_domain/_types/outcome.type.js';
import type { TImportResolution } from '../../../_graph/_types/dependency-graph.type.js';
import type { TModuleRecord } from '../../../_syntax/_types/module-record.type.js';
import type {
  TCollectModulesInput,
  TModuleCollection,
} from './collect-modules.type.js';

import { assertInvariant } from '../../../_domain/_utils/assert-invariant/index.js';
import { canonicalizeDirectory } from '../../_runtime@shared/_adapters/canonicalize-directory/index.js';
import { analyzeQueuedModule } from './_adapters/analyze-queued-module/index.js';
import { collectUnvisitedLocalPaths } from './_utils/collect-unvisited-local-paths/index.js';
import { orderModuleCollection } from './_utils/order-module-collection/index.js';
import { selectTreeFilePaths } from './_utils/select-tree-file-paths/index.js';

export function collectModules(input: TCollectModulesInput): TModuleCollection {
  const baseDirectory = canonicalizeDirectory(input.baseDirectory);
  const queue = [...selectTreeFilePaths(input.inventory)];
  const visited = new Set<string>(queue);
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
      producer: input.producer,
      relativePath,
      resolver: input.resolver,
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
