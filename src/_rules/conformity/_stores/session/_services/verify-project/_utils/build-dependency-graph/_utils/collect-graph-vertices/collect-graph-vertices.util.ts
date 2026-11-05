import type { TModuleRecord } from '../../../../../../_session@shared/_types/module-record.type.js';
import type {
  TImportResolution,
  TVertexNature,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function collectGraphVertices(
  inventory: TInventory,
  records: ReadonlyMap<string, TModuleRecord>,
  resolutions: ReadonlyMap<string, readonly TImportResolution[]>
): {
  readonly natures: readonly TVertexNature[];
  readonly paths: readonly string[];
  readonly pathToVertex: ReadonlyMap<string, number>;
} {
  const readVertexNature = (path: string): TVertexNature => {
    const itemId = inventory.pathToId.get(path);
    const item = itemId === undefined ? undefined : inventory.items[itemId];
    return item === undefined || item.treeOrigin === null
      ? { kind: 'external-local-file' }
      : { inventoryId: item.id, kind: 'tree-node' };
  };

  const paths = new Set<string>(records.keys());
  for (const sourceResolutions of resolutions.values()) {
    for (const resolution of sourceResolutions) {
      if (resolution.target.type === 'local-file') {
        paths.add(resolution.target.path);
      }
    }
  }
  const ordered = [...paths];
  ordered.sort(compareOrdinal);
  const pathToVertex = new Map<string, number>();
  const natures: TVertexNature[] = [];
  for (const [index, path] of ordered.entries()) {
    pathToVertex.set(path, index);
    natures.push(readVertexNature(path));
  }
  return { natures, paths: ordered, pathToVertex };
}
