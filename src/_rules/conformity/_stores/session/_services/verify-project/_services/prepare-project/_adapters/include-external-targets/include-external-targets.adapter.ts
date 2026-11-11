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

  const resolveTargetKind = (
    target: string
  ): null | {
    readonly absolute: string;
    readonly kind: 'directory' | 'file';
    readonly normalized: string;
  } => {
    const normalized = toPosixPath(target);
    if (pathToId.has(normalized)) {
      return null;
    }
    const absolute = nodePath.resolve(baseDirectory, normalized);
    const stats = nodeFs.statSync(absolute, { throwIfNoEntry: false });
    if (stats?.isDirectory() === true) {
      return { absolute, kind: 'directory', normalized };
    }
    if (stats?.isFile() === true) {
      return { absolute, kind: 'file', normalized };
    }
    return null;
  };

  const collectRootCandidates = (): readonly string[] => {
    if (!nodeFs.existsSync(baseDirectory)) {
      return [];
    }
    const dirents = nodeFs.readdirSync(baseDirectory, { withFileTypes: true });
    return dirents
      .filter(
        (dirent) =>
          dirent.isFile() &&
          dirent.name !== 'fafconfig.ts' &&
          LINTABLE_EXTENSIONS.some((extension) =>
            dirent.name.endsWith(extension)
          )
      )
      .map((dirent) => dirent.name);
  };

  const sections = [
    config.faf.common?.externalDependencies,
    ...config.faf.locals.map((local) => local.externalDependencies),
  ];
  const targets = [
    ...sections.flatMap((section) => section ?? []).flatMap((edge) => edge.to),
    ...Object.values(config.faf.common?.aliases ?? {}),
    ...collectRootCandidates(),
  ];

  for (const target of targets) {
    const resolved = resolveTargetKind(target);
    if (resolved === null) {
      continue;
    }
    const id = items.length;
    const isSymlink = nodeFs.lstatSync(resolved.absolute).isSymbolicLink();
    const item: TInventoryItem = {
      depth: 0,
      id,
      isSymlink,
      kind: resolved.kind,
      parentId: null,
      path: resolved.normalized,
      preorderEnd: id,
      preorderStart: id,
      realPath: nodeFs.realpathSync(resolved.absolute),
      treeOrigin: null,
    };
    items.push(item);
    pathToId.set(item.path, id);
    realPathToId.set(item.realPath, id);
  }

  return { items, pathToId, realPathToId };
}
