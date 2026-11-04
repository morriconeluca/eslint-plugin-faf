import nodePath from 'node:path';

import type { TSelectAnchorPathInput } from './select-anchor-path.type.js';

import { isLintablePath } from './_select-anchor-path@shared/_utils/is-lintable-path/index.js';
import { anchorDomainPath } from './_utils/anchor-domain-path/index.js';
import { findInventoryItem } from './_utils/find-inventory-item/index.js';

export function selectAnchorPath(input: TSelectAnchorPathInput): string {
  if (
    input.outcome.family === 'configuration' ||
    input.inventory === undefined
  ) {
    return input.configPath;
  }
  const item = findInventoryItem(
    input.inventory,
    input.baseDirectory,
    input.outcome.element
  );
  if (item === undefined) {
    return input.configPath;
  }
  if (item.kind === 'file' && isLintablePath(item.path)) {
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
