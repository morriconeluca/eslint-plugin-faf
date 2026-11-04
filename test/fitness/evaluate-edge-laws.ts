import type {
  TEdgeLawDeclaration,
  THorizontalHierarchy,
} from './edge-law-declaration.js';
import type { TRelativeImportEdge } from './relative-import-edges.js';

import { compareOrdinal } from '../../src/_rules/conformity/_stores/session/_services/verify-project/_verify-project@shared/_utils/compare-ordinal/index.js';

export type TEdgeLawName =
  | 'climb'
  | 'encapsulation'
  | 'peer-separation'
  | 'tree-exit'
  | 'unidirectionality';

export type TEdgeViolation = {
  readonly edge: TRelativeImportEdge;
  readonly law: TEdgeLawName;
};

type TEdgeLawContext = {
  readonly categoryNames: ReadonlySet<string>;
  readonly externalAuthorizations: ReadonlySet<string>;
  readonly fragmentDirectories: ReadonlySet<string>;
  readonly hierarchies: readonly THorizontalHierarchy[];
  readonly rootFragmentPaths: ReadonlySet<string>;
  readonly rootLayerPaths: ReadonlySet<string>;
  readonly subcategoryNames: ReadonlySet<string>;
  readonly treeOrigins: readonly string[];
};

type THierarchyRank = {
  readonly group: number;
  readonly rank: number;
};

const INDEX_FILE_NAME = 'index.ts';
const FRACTAL_BRANCH_SUFFIX = '@shared';

export function evaluateEdgeLaws(
  edges: readonly TRelativeImportEdge[],
  declaration: TEdgeLawDeclaration,
  fragmentDirectories: readonly string[]
): readonly TEdgeViolation[] {
  const context = createContext(declaration, fragmentDirectories);
  const seen = new Set<string>();
  const violations: TEdgeViolation[] = [];
  for (const edge of edges) {
    for (const violation of violationsForEdge(edge, context)) {
      const key = violationKey(violation);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      violations.push(violation);
    }
  }
  violations.sort(compareViolations);
  return violations;
}

export function formatEdgeViolation(violation: TEdgeViolation): string {
  return `${violation.law}: ${violation.edge.from} -> ${violation.edge.to}`;
}

export function formatEdgeViolations(
  violations: readonly TEdgeViolation[]
): string {
  return violations
    .map((violation) => formatEdgeViolation(violation))
    .join('\n');
}

function addSubcategoryTier(
  tier: readonly string[],
  categoryNames: ReadonlySet<string>,
  names: Set<string>
): void {
  for (const name of tier) {
    if (!categoryNames.has(name)) {
      names.add(name);
    }
  }
}

function authorizationKey(from: string, to: string): string {
  return `${from}\0${to}`;
}

function authorizationSet(
  declaration: TEdgeLawDeclaration
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const authorization of declaration.externalAuthorizations) {
    for (const from of authorization.from) {
      for (const to of authorization.to) {
        keys.add(authorizationKey(from, to));
      }
    }
  }
  return keys;
}

function climbViolation(
  edge: TRelativeImportEdge,
  source: readonly string[],
  target: readonly string[],
  prefix: number,
  context: TEdgeLawContext
): TEdgeViolation | undefined {
  const sourceChild = source[prefix];
  const targetChild = target[prefix];
  const parentPath = source.slice(0, prefix).join('/');
  const isViolation =
    source.length > prefix + 1 &&
    sourceChild !== undefined &&
    targetChild !== undefined &&
    isClimbTarget(sourceChild, targetChild, parentPath, context);
  return isViolation ? { edge, law: 'climb' } : undefined;
}

function commonPrefixLength(
  left: readonly string[],
  right: readonly string[]
): number {
  let index = 0;
  const limit = Math.min(left.length, right.length);
  while (index < limit && left[index] === right[index]) {
    index += 1;
  }
  return index;
}

function compareViolations(
  left: TEdgeViolation,
  right: TEdgeViolation
): number {
  return compareOrdinal(formatEdgeViolation(left), formatEdgeViolation(right));
}

function createContext(
  declaration: TEdgeLawDeclaration,
  fragmentDirectories: readonly string[]
): TEdgeLawContext {
  const categoryNames = new Set(declaration.categoryNames);
  return {
    categoryNames,
    externalAuthorizations: authorizationSet(declaration),
    fragmentDirectories: new Set(fragmentDirectories),
    hierarchies: declaration.horizontalHierarchies,
    rootFragmentPaths: new Set(declaration.rootFragmentPaths),
    rootLayerPaths: new Set(declaration.rootLayerPaths),
    subcategoryNames: subcategoryNamesFrom(
      declaration.horizontalHierarchies,
      categoryNames
    ),
    treeOrigins: declaration.treeOrigins,
  };
}

function encapsulationAt(
  edge: TRelativeImportEdge,
  target: readonly string[],
  index: number,
  context: TEdgeLawContext
): TEdgeViolation | undefined {
  const segment = target[index];
  if (segment === undefined || !context.categoryNames.has(segment)) {
    return undefined;
  }
  const fragment = fragmentBoundary(target, index, context);
  if (fragment === undefined) {
    return undefined;
  }
  const isExposed =
    edge.from.startsWith(`${fragment}/`) ||
    edge.to === `${fragment}/${INDEX_FILE_NAME}`;
  return isExposed ? undefined : { edge, law: 'encapsulation' };
}

function encapsulationViolation(
  edge: TRelativeImportEdge,
  target: readonly string[],
  context: TEdgeLawContext
): TEdgeViolation | undefined {
  for (let index = 0; index < target.length - 1; index += 1) {
    const violation = encapsulationAt(edge, target, index, context);
    if (violation !== undefined) {
      return violation;
    }
  }
  return undefined;
}

function fractalBranchViolations(
  edge: TRelativeImportEdge,
  source: readonly string[],
  target: readonly string[]
): readonly TEdgeViolation[] {
  const violations: TEdgeViolation[] = [];
  for (let index = 0; index < source.length - 1; index += 1) {
    const name = source[index];
    const isOutsideBranch =
      name !== undefined &&
      isFractalBranchName(name) &&
      hasSharedPrefix(source, target, index) &&
      target[index] !== name;
    if (isOutsideBranch) {
      violations.push({ edge, law: 'unidirectionality' });
    }
  }
  return violations;
}

function fragmentBoundary(
  target: readonly string[],
  categoryIndex: number,
  context: TEdgeLawContext
): string | undefined {
  let cursor = categoryIndex + 1;
  while (
    cursor < target.length - 1 &&
    context.subcategoryNames.has(target[cursor] ?? '')
  ) {
    cursor += 1;
  }
  const child = cursor < target.length - 1 ? target[cursor] : undefined;
  return child === undefined || isFractalBranchName(child)
    ? undefined
    : target.slice(0, cursor + 1).join('/');
}

function hasSharedPrefix(
  left: readonly string[],
  right: readonly string[],
  length: number
): boolean {
  if (right.length < length) {
    return false;
  }
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function isAuthorizedByHierarchy(
  sourceName: string,
  targetName: string,
  parentPath: string,
  context: TEdgeLawContext
): boolean {
  const sourceRank = rankOf(sourceName, context.hierarchies);
  const targetRank = rankOf(targetName, context.hierarchies);
  if (
    sourceRank === undefined ||
    targetRank === undefined ||
    !isDescendingRank(sourceRank, targetRank)
  ) {
    return false;
  }
  if (
    context.subcategoryNames.has(sourceName) &&
    context.subcategoryNames.has(targetName)
  ) {
    return true;
  }
  return isCategoryHierarchyParent(parentPath, context);
}

function isAuthorizedTreeExit(
  edge: TRelativeImportEdge,
  context: TEdgeLawContext
): boolean {
  return context.externalAuthorizations.has(
    authorizationKey(edge.from, edge.to)
  );
}

function isCategoryHierarchyParent(
  parentPath: string,
  context: TEdgeLawContext
): boolean {
  return (
    context.rootLayerPaths.has(parentPath) ||
    isFractalBranchPath(parentPath) ||
    isLayerPath(parentPath, context)
  );
}

function isCategoryParent(
  parentName: string | undefined,
  context: TEdgeLawContext
): boolean {
  return (
    parentName !== undefined &&
    (context.categoryNames.has(parentName) ||
      context.subcategoryNames.has(parentName))
  );
}

function isClimbTarget(
  sourceChild: string,
  targetChild: string,
  parentPath: string,
  context: TEdgeLawContext
): boolean {
  return (
    !isFractalBranchName(targetChild) &&
    !isAuthorizedByHierarchy(sourceChild, targetChild, parentPath, context)
  );
}

function isDescendingRank(
  sourceRank: THierarchyRank,
  targetRank: THierarchyRank
): boolean {
  return (
    sourceRank.group === targetRank.group && sourceRank.rank > targetRank.rank
  );
}

function isFractalBranchName(name: string): boolean {
  return name.endsWith(FRACTAL_BRANCH_SUFFIX);
}

function isFractalBranchPath(parentPath: string): boolean {
  const name = parentPath.slice(parentPath.lastIndexOf('/') + 1);
  return name.length > 0 && isFractalBranchName(name);
}

function isInsideTree(filePath: string, origins: readonly string[]): boolean {
  for (const origin of origins) {
    if (filePath === origin || filePath.startsWith(`${origin}/`)) {
      return true;
    }
  }
  return false;
}

function isLayerName(name: string, context: TEdgeLawContext): boolean {
  return (
    name.startsWith('_') &&
    !context.categoryNames.has(name) &&
    !context.subcategoryNames.has(name) &&
    !isFractalBranchName(name)
  );
}

function isLayerPath(parentPath: string, context: TEdgeLawContext): boolean {
  const slash = parentPath.lastIndexOf('/');
  const name = slash === -1 ? parentPath : parentPath.slice(slash + 1);
  if (!isLayerName(name, context)) {
    return false;
  }
  const parent = slash === -1 ? '' : parentPath.slice(0, slash);
  return parent.length > 0 && isCategoryHierarchyParent(parent, context);
}

function isPeerTarget(
  sourceChild: string,
  targetChild: string,
  parentPath: string,
  context: TEdgeLawContext
): boolean {
  return (
    sourceChild !== targetChild &&
    !isFractalBranchName(targetChild) &&
    !isAuthorizedByHierarchy(sourceChild, targetChild, parentPath, context)
  );
}

function isPrivateCategorySegment(
  segments: readonly string[],
  index: number,
  context: TEdgeLawContext
): boolean {
  const name = segments[index];
  if (name === undefined || !context.categoryNames.has(name)) {
    return false;
  }
  const parent = segments.slice(0, index).join('/');
  return (
    context.fragmentDirectories.has(parent) ||
    context.rootFragmentPaths.has(parent)
  );
}

function peerViolation(
  edge: TRelativeImportEdge,
  source: readonly string[],
  target: readonly string[],
  prefix: number,
  context: TEdgeLawContext
): TEdgeViolation | undefined {
  const sourceChild = source[prefix];
  const targetChild = target[prefix];
  const parentPath = source.slice(0, prefix).join('/');
  const isViolation =
    isCategoryParent(source[prefix - 1], context) &&
    sourceChild !== undefined &&
    targetChild !== undefined &&
    isPeerTarget(sourceChild, targetChild, parentPath, context);
  return isViolation ? { edge, law: 'peer-separation' } : undefined;
}

function privateCategoryViolations(
  edge: TRelativeImportEdge,
  source: readonly string[],
  target: readonly string[],
  context: TEdgeLawContext
): readonly TEdgeViolation[] {
  const violations: TEdgeViolation[] = [];
  for (let index = 0; index < source.length - 1; index += 1) {
    const isParentFile =
      isPrivateCategorySegment(source, index, context) &&
      target.length === index + 1 &&
      hasSharedPrefix(source, target, index);
    if (isParentFile) {
      violations.push({ edge, law: 'unidirectionality' });
    }
  }
  return violations;
}

function rankOf(
  name: string,
  hierarchies: readonly THorizontalHierarchy[]
): THierarchyRank | undefined {
  let group = 0;
  for (const hierarchy of hierarchies) {
    let rank = 0;
    for (const tier of hierarchy) {
      if (tier.includes(name)) {
        return { group, rank };
      }
      rank += 1;
    }
    group += 1;
  }
  return undefined;
}

function subcategoryNamesFrom(
  hierarchies: readonly THorizontalHierarchy[],
  categoryNames: ReadonlySet<string>
): ReadonlySet<string> {
  const names = new Set<string>();
  for (const hierarchy of hierarchies) {
    for (const tier of hierarchy) {
      addSubcategoryTier(tier, categoryNames, names);
    }
  }
  return names;
}

function treeExitViolation(
  edge: TRelativeImportEdge,
  context: TEdgeLawContext
): TEdgeViolation | undefined {
  const isViolation =
    !isInsideTree(edge.to, context.treeOrigins) &&
    !isAuthorizedTreeExit(edge, context);
  return isViolation ? { edge, law: 'tree-exit' } : undefined;
}

function violationKey(violation: TEdgeViolation): string {
  return `${violation.law}\0${violation.edge.from}\0${violation.edge.to}`;
}

function violationsForEdge(
  edge: TRelativeImportEdge,
  context: TEdgeLawContext
): readonly TEdgeViolation[] {
  const exit = treeExitViolation(edge, context);
  if (exit !== undefined) {
    return [exit];
  }
  if (!isInsideTree(edge.to, context.treeOrigins)) {
    return [];
  }
  const source = edge.from.split('/');
  const target = edge.to.split('/');
  const prefix = commonPrefixLength(source, target);
  const violations: TEdgeViolation[] = [
    ...privateCategoryViolations(edge, source, target, context),
    ...fractalBranchViolations(edge, source, target),
  ];
  const peer = peerViolation(edge, source, target, prefix, context);
  const climb = climbViolation(edge, source, target, prefix, context);
  const encapsulation = encapsulationViolation(edge, target, context);
  if (peer !== undefined) {
    violations.push(peer);
  }
  if (climb !== undefined) {
    violations.push(climb);
  }
  if (encapsulation !== undefined) {
    violations.push(encapsulation);
  }
  return violations;
}
