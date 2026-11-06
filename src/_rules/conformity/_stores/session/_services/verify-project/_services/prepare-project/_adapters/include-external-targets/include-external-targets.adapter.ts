import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { LINTABLE_EXTENSIONS } from '../../../../../../../../../../_src@shared/_constants/faf.constant.js';
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
  const targets = sections
    .flatMap((section) => section ?? [])
    .flatMap((edge) => edge.to);

  const dirents = nodeFs.existsSync(baseDirectory)
    ? nodeFs.readdirSync(baseDirectory, { withFileTypes: true })
    : [];

  for (const dirent of dirents) {
    const isRootCandidate =
      dirent.isFile() &&
      dirent.name !== 'fafconfig.ts' &&
      LINTABLE_EXTENSIONS.some((extension) => dirent.name.endsWith(extension));
    if (isRootCandidate) {
      targets.push(dirent.name);
    }
  }

  for (const target of targets) {
    const normalized = toPosixPath(target);
    const absolute = nodePath.resolve(baseDirectory, normalized);
    const stats = nodeFs.statSync(absolute, { throwIfNoEntry: false });
    const isRegularFile = stats?.isFile() === true;
    if (!isRegularFile || pathToId.has(normalized)) {
      continue;
    }
    const id = items.length;
    const isSymlink = nodeFs.lstatSync(absolute).isSymbolicLink();
    const item: TInventoryItem = {
      depth: 0,
      id,
      isSymlink,
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
