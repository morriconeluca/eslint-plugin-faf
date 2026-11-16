import nodePath from 'node:path';
import nodePathPosix from 'node:path/posix';

import type {
  TInventory,
  TInventoryItem,
  TTaxonomyModel,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { TSelectAnchorPathInput } from './select-anchor-path.type.js';

import { LINTABLE_EXTENSIONS } from '../../../../../../_src@shared/_constants/faf.constant.js';
import { toPosixPath } from '../../../../../../_src@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from '../../../../_conformity@shared/_utils/compare-ordinal/index.js';

export function selectAnchorPath(input: TSelectAnchorPathInput): string {
  if (
    input.outcome.family === 'configuration' ||
    input.inventory === undefined
  ) {
    return input.configPath;
  }

  const findInventoryItem = (
    inventory: TInventory,
    baseDirectory: string,
    element: string
  ): TInventoryItem | undefined => {
    const normalizedId = inventory.pathToId.get(toPosixPath(element));
    if (normalizedId !== undefined) {
      return inventory.items[normalizedId];
    }
    if (!nodePath.isAbsolute(element)) {
      return undefined;
    }
    const relativeId = inventory.pathToId.get(
      toPosixPath(nodePath.relative(baseDirectory, element))
    );
    return relativeId === undefined ? undefined : inventory.items[relativeId];
  };

  const lintableChildren = (
    inventory: TInventory,
    parentId: number
  ): readonly TInventoryItem[] => {
    const children: TInventoryItem[] = [];
    for (const candidate of inventory.items) {
      const extension = nodePathPosix.extname(candidate.path);
      if (
        candidate.parentId === parentId &&
        candidate.kind === 'file' &&
        LINTABLE_EXTENSIONS.some((allowed) => allowed === extension)
      ) {
        children.push(candidate);
      }
    }
    const ordered = [...children];
    ordered.sort((left, right) => compareOrdinal(left.path, right.path));
    return ordered;
  };

  const anchorDomainPath = (
    inventory: TInventory,
    model: TTaxonomyModel | undefined,
    domain: TInventoryItem
  ): string | undefined => {
    let current: TInventoryItem | undefined = domain;
    while (current !== undefined) {
      const children = lintableChildren(inventory, current.id);
      const classification = model?.byPath.get(current.path);
      const isFragment = classification?.domainKind === 'fragment';
      const master =
        isFragment && model !== undefined
          ? children.find(
              (child) =>
                model.byItemId.get(child.id)?.nodeKind === 'master-node'
            )
          : undefined;
      if (master !== undefined) {
        return master.path;
      }
      const firstChild = children[0];
      if (firstChild !== undefined) {
        return firstChild.path;
      }
      current =
        current.parentId === null
          ? undefined
          : inventory.items[current.parentId];
    }
    return undefined;
  };

  const item = findInventoryItem(
    input.inventory,
    input.baseDirectory,
    input.outcome.element
  );
  if (item === undefined) {
    return input.configPath;
  }
  const itemExtension = nodePathPosix.extname(item.path);
  if (
    item.kind === 'file' &&
    LINTABLE_EXTENSIONS.some((allowed) => allowed === itemExtension)
  ) {
    return nodePath.resolve(input.baseDirectory, item.path);
  }
  const parent =
    item.parentId === null ? undefined : input.inventory.items[item.parentId];
  const domain = item.kind === 'directory' ? item : parent;
  if (domain === undefined) {
    return input.configPath;
  }
  const relativeAnchor = anchorDomainPath(input.inventory, input.model, domain);
  return relativeAnchor === undefined
    ? input.configPath
    : nodePath.resolve(input.baseDirectory, relativeAnchor);
}
