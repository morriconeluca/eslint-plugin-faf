import type {
  TEffectiveMimeticStructure,
  TEffectiveTree,
  TInventory,
  TItemClassification,
  TTaxonomyModel,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { KEBAB_CASE_PATTERN } from './nomenclature.constant.js';

const STANDARD_DOMAIN_KINDS = new Set([
  'category',
  'fragment',
  'layer',
  'sub-category',
]);

const LOGICAL_NODE_KINDS = new Set([
  'category-node',
  'fragment-node',
  'master-node',
  'sub-graph-node',
]);

export function isViolatingDomainName(
  classification: TItemClassification,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  if (
    classification.entryKind !== 'directory' ||
    classification.domainKind === null ||
    classification.relationalQualifications.isPathFragment
  ) {
    return false;
  }

  const item = inventory.items[classification.itemId];
  const isOrigin = trees.some((tree) => tree.originPath === item?.path);
  if (item === undefined || isOrigin) {
    return false;
  }

  const directoryName = classification.path.slice(
    classification.path.lastIndexOf('/') + 1
  );

  const { domainKind } = classification;
  if (domainKind === 'fractal-branch') {
    const parentPath = inventory.items[item.parentId ?? -1]?.path;
    const scope = parentPath
      ?.slice(parentPath.lastIndexOf('/') + 1)
      .replace(/^_/u, '');
    return directoryName !== `_${scope}@shared`;
  }

  if (!STANDARD_DOMAIN_KINDS.has(domainKind)) {
    return false;
  }

  const isFragment = domainKind === 'fragment';
  const hasMatchingPrefix = isFragment !== directoryName.startsWith('_');
  const checkedSegment = directoryName.slice(Number(!isFragment));
  return !hasMatchingPrefix || !KEBAB_CASE_PATTERN.test(checkedSegment);
}

export function isViolatingPathFragmentName(
  identifier: string,
  lookupPath: string,
  mimeticStructures: readonly TEffectiveMimeticStructure[]
): boolean {
  const isKebabCase = KEBAB_CASE_PATTERN.test(identifier);
  const matchingCandidates = mimeticStructures.flatMap((structure) =>
    structure.paths
      .filter(
        (prefix) => lookupPath === prefix || lookupPath.startsWith(`${prefix}/`)
      )
      .map((prefix) => ({
        prefixLength: prefix.length,
        structure,
      }))
  );
  matchingCandidates.sort(
    (left, right) => right.prefixLength - left.prefixLength
  );
  const matchedStructure = matchingCandidates[0]?.structure;

  const actions = matchedStructure?.actions ?? [];
  if (actions.length === 0) {
    return !isKebabCase;
  }

  const matchingActions = actions.filter(
    (action) => identifier === action || identifier.startsWith(`${action}-`)
  );
  matchingActions.sort((left, right) => right.length - left.length);
  const longestAction = matchingActions[0];
  if (longestAction === undefined || identifier === longestAction) {
    return true;
  }

  const target = identifier.slice(longestAction.length + 1);
  return !KEBAB_CASE_PATTERN.test(target);
}

export function isViolatingPathFragmentOrNodeName(
  classification: TItemClassification,
  taxonomy: TTaxonomyModel,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  const item = inventory.items[classification.itemId];
  const effectiveTree = trees.find(
    (candidateTree) => candidateTree.originPath === item?.treeOrigin
  );
  if (effectiveTree === undefined) {
    return false;
  }

  const { domainKind, entryKind, nodeKind, path } = classification;
  const entryName = path.slice(path.lastIndexOf('/') + 1);

  if (entryKind === 'directory') {
    const isPathFragment =
      domainKind === 'fragment' &&
      classification.relationalQualifications.isPathFragment;
    return (
      isPathFragment &&
      isViolatingPathFragmentName(
        entryName,
        path,
        effectiveTree.mimeticPathStructures
      )
    );
  }

  if (!LOGICAL_NODE_KINDS.has(nodeKind ?? '')) {
    return false;
  }

  const dotIndex = entryName.indexOf('.');
  const logicalNodeStem =
    dotIndex === -1 ? entryName : entryName.slice(0, dotIndex);
  const parent = taxonomy.byItemId.get(item?.parentId ?? -1);

  return parent?.relationalQualifications.isPathFragment === true
    ? isViolatingPathFragmentName(
        logicalNodeStem,
        parent.path,
        effectiveTree.mimeticPathStructures
      )
    : !KEBAB_CASE_PATTERN.test(logicalNodeStem);
}

export function isViolatingPathSubCategoryName(
  classification: TItemClassification
): boolean {
  if (classification.domainKind !== 'path-sub-category') {
    return false;
  }
  const directoryName = classification.path.slice(
    classification.path.lastIndexOf('/') + 1
  );
  if (directoryName.startsWith('_[') && directoryName.endsWith(']')) {
    return !KEBAB_CASE_PATTERN.test(directoryName.slice(2, -1));
  }
  const isStaticSegment =
    directoryName.startsWith('_') && !directoryName.startsWith('_[');
  return !isStaticSegment || !KEBAB_CASE_PATTERN.test(directoryName.slice(1));
}
