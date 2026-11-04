import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { toPosixPath } from '../../../../../../_session@shared/_utils/to-posix-path/index.js';

export function includeExternalTargets(
  inventory: TInventory,
  config: TFAFConfig,
  baseDirectory: string
): TInventory {
  const items = [...inventory.items];
  const pathToId = new Map(inventory.pathToId);
  const realPathToId = new Map(inventory.realPathToId);
  const sections = [
    config.faf.common?.externalDependencies,
    ...config.faf.locals.map((local) => local.externalDependencies),
  ];
  const targets: string[] = [];
  for (const section of sections) {
    if (section !== undefined) {
      for (const edge of section) {
        targets.push(...edge.to);
      }
    }
  }
  for (const target of targets) {
    const normalized = toPosixPath(target);
    const absolute = nodePath.resolve(baseDirectory, normalized);
    const stats = nodeFs.statSync(absolute, { throwIfNoEntry: false });
    if (stats === undefined || !stats.isFile() || pathToId.has(normalized)) {
      continue;
    }
    const id = items.length;
    const item: TInventoryItem = {
      depth: 0,
      id,
      isSymlink: nodeFs.lstatSync(absolute).isSymbolicLink(),
      kind: 'file',
      parentId: null,
      path: normalized,
      preorderEnd: id,
      preorderStart: id,
      realPath: nodeFs.realpathSync(absolute),
      treeOrigin: null,
    };
    items.push(item);
    pathToId.set(item.path, id);
    realPathToId.set(item.realPath, id);
  }
  return { items, pathToId, realPathToId };
}
