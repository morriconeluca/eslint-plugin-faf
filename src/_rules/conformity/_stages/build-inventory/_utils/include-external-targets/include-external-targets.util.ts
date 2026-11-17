import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TFAFConfig } from '../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { TResolvedExternalTarget } from './include-external-targets.type.js';

import {
  CONFIG_FILE_NAME,
  LINTABLE_EXTENSIONS,
} from '../../../../../../_src@shared/_constants/faf.constant.js';
import { toPosixPath } from '../../../../../../_src@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from '../../../../_conformity@shared/_utils/compare-ordinal/index.js';
import { collectConfigTargetPaths } from './_utils/collect-config-target-paths/index.js';
import { filterExternalOverlayPaths } from './_utils/filter-external-overlay-paths/index.js';
import { shouldTraverseExternalDirectory } from './_utils/should-traverse-external-directory/index.js';

export function includeExternalTargets(
  inventory: TInventory,
  config: TFAFConfig,
  baseDirectory: string,
  origins?: readonly string[],
  overlayPaths?: readonly string[]
): TInventory {
  const resolvedBaseDirectory = nodePath.resolve(baseDirectory);
  const items = [...inventory.items];
  const pathToId = new Map(inventory.pathToId);
  const realPathToId = new Map(inventory.realPathToId);

  const declaredOriginList =
    origins ??
    config.faf.locals.flatMap((local) => [
      ...(local.rootLayers ?? []),
      ...(local.rootFragments?.map((rootFragment) => rootFragment.path) ?? []),
    ]);

  const declaredOrigins = new Set(
    declaredOriginList.map((rawOrigin) => {
      const posix = toPosixPath(rawOrigin);
      const withoutPrefix = posix.startsWith('./') ? posix.slice(2) : posix;
      return withoutPrefix.endsWith('/') && withoutPrefix.length > 1
        ? withoutPrefix.slice(0, -1)
        : withoutPrefix;
    })
  );

  const resolveTargetKind = (
    target: string
  ): null | TResolvedExternalTarget => {
    const normalized = toPosixPath(target);
    if (normalized.length === 0 || pathToId.has(normalized)) {
      return null;
    }
    const absolute = nodePath.resolve(resolvedBaseDirectory, normalized);
    const relativeToBase = toPosixPath(
      nodePath.relative(resolvedBaseDirectory, absolute)
    );
    if (
      relativeToBase === '..' ||
      relativeToBase.startsWith('../') ||
      nodePath.isAbsolute(relativeToBase)
    ) {
      return null;
    }
    const stats = nodeFs.statSync(absolute, { throwIfNoEntry: false });
    if (stats?.isDirectory() === true) {
      return { absolute, kind: 'directory', normalized };
    }
    if (stats?.isFile() === true) {
      return { absolute, kind: 'file', normalized };
    }
    return null;
  };

  const collectExternalCandidates = (): readonly string[] => {
    if (declaredOrigins.has('.') || !nodeFs.existsSync(resolvedBaseDirectory)) {
      return [];
    }

    const readDirectory = (directory: string): readonly nodeFs.Dirent[] => {
      try {
        return nodeFs.readdirSync(directory, {
          withFileTypes: true,
        });
      } catch {
        return [];
      }
    };

    const candidates: string[] = [];
    const directoryQueue: string[] = [resolvedBaseDirectory];

    const processDirent = (
      dirent: nodeFs.Dirent,
      currentDirectory: string
    ): void => {
      if (dirent.isSymbolicLink()) {
        return;
      }
      const fullPath = nodePath.join(currentDirectory, dirent.name);
      const relativePath = toPosixPath(
        nodePath.relative(resolvedBaseDirectory, fullPath)
      );

      if (dirent.isDirectory()) {
        if (
          shouldTraverseExternalDirectory({
            declaredOrigins,
            isAtRoot: currentDirectory === resolvedBaseDirectory,
            name: dirent.name,
            relativePath,
          })
        ) {
          directoryQueue.push(fullPath);
        }
        return;
      }

      if (!dirent.isFile() || dirent.name.startsWith('.')) {
        return;
      }
      if (
        relativePath !== CONFIG_FILE_NAME &&
        LINTABLE_EXTENSIONS.some((extension) => dirent.name.endsWith(extension))
      ) {
        candidates.push(relativePath);
      }
    };

    for (const currentDirectory of directoryQueue) {
      for (const dirent of readDirectory(currentDirectory)) {
        processDirent(dirent, currentDirectory);
      }
    }

    candidates.sort(compareOrdinal);
    return candidates;
  };

  const collectOverlayTargets = (): readonly string[] =>
    filterExternalOverlayPaths(
      resolvedBaseDirectory,
      declaredOrigins,
      overlayPaths
    ).filter((relativePath) => {
      const absolute = nodePath.resolve(resolvedBaseDirectory, relativePath);
      const lstat = nodeFs.lstatSync(absolute, { throwIfNoEntry: false });
      return lstat?.isFile() === true;
    });

  const targets = [
    ...collectConfigTargetPaths(config),
    ...collectOverlayTargets(),
    ...collectExternalCandidates(),
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
