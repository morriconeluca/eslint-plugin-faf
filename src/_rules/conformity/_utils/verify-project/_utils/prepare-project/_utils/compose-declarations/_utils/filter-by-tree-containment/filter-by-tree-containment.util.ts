import type {
  TFAFCommonConfig,
  TFAFForeignNodeFamily,
  TFAFLocalConfig,
} from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveForeignFamily,
  TEffectiveForeignNodes,
  TEffectiveHorizontalHierarchy,
  TEffectiveMimeticStructure,
  TEffectiveOrientedPair,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TTreeScopedDeclarations } from './filter-by-tree-containment.type.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export const filterByTreeContainment = (
  originPath: string,
  common: TFAFCommonConfig | undefined,
  local: TFAFLocalConfig
): TTreeScopedDeclarations => {
  const isPathInTree = (path: string): boolean =>
    originPath === '.' ||
    path === originPath ||
    path.startsWith(`${originPath}/`);

  const buildForeignNodes = (): TEffectiveForeignNodes => {
    const rawItems = local.foreignNodes ?? common?.foreignNodes;
    if (rawItems === undefined) {
      return { families: [], individualPaths: [] };
    }

    const isInherited = local.foreignNodes === undefined;
    const stringItems = rawItems.filter(
      (item): item is string => typeof item === 'string'
    );
    const familyItems = rawItems.filter(
      (item): item is TFAFForeignNodeFamily => typeof item !== 'string'
    );

    const individualPaths = stringItems.filter(
      (item) => !isInherited || isPathInTree(item)
    );
    individualPaths.sort(compareOrdinal);

    const families: TEffectiveForeignFamily[] = [];
    for (const item of familyItems) {
      const paths = isInherited
        ? item.paths.filter((itemPath: string) => isPathInTree(itemPath))
        : [...item.paths];
      if (paths.length > 0) {
        families.push({
          paths,
          patterns: [...item.patterns],
        });
      }
    }

    return { families, individualPaths };
  };

  const buildHorizontalHierarchies =
    (): readonly TEffectiveHorizontalHierarchy[] =>
      (local.horizontalHierarchies ?? [])
        .filter((entry) => isPathInTree(entry.path))
        .map((entry) => ({
          hierarchy: entry.hierarchy,
          path: entry.path,
        }));

  const buildMimeticStructures = (): readonly TEffectiveMimeticStructure[] => {
    if (local.mimeticPathStructures !== undefined) {
      return local.mimeticPathStructures.map((mimeticStructure) => ({
        actions:
          mimeticStructure.actions === undefined
            ? null
            : [...mimeticStructure.actions],
        paths: [...mimeticStructure.paths],
      }));
    }

    if (common?.mimeticPathStructures === undefined) {
      return [];
    }

    const result: TEffectiveMimeticStructure[] = [];
    for (const mimeticStructure of common.mimeticPathStructures) {
      const filteredPaths = mimeticStructure.paths.filter((itemPath: string) =>
        isPathInTree(itemPath)
      );
      if (filteredPaths.length > 0) {
        result.push({
          actions:
            mimeticStructure.actions === undefined
              ? null
              : [...mimeticStructure.actions],
          paths: filteredPaths,
        });
      }
    }
    return result;
  };

  const buildSortedPaths = (
    rawPaths: readonly string[] | undefined,
    isInherited: boolean
  ): readonly string[] => {
    if (rawPaths === undefined) {
      return [];
    }

    const included = rawPaths.filter(
      (path) => !isInherited || isPathInTree(path)
    );
    included.sort(compareOrdinal);
    return included;
  };

  const buildOrientedPairs = (
    rawEdges:
      | readonly {
          readonly from: readonly string[];
          readonly to: readonly string[];
        }[]
      | undefined,
    isInherited: boolean,
    shouldIncludeSource: (from: string) => boolean
  ): readonly TEffectiveOrientedPair[] => {
    if (rawEdges === undefined) {
      return [];
    }

    const flatTargets = rawEdges.flatMap((edge) =>
      edge.from.flatMap((from) =>
        isInherited && !shouldIncludeSource(from)
          ? []
          : edge.to.map((to) => ({ from, to }))
      )
    );

    const seen = new Set<string>();
    const pairs: TEffectiveOrientedPair[] = [];
    for (const target of flatTargets) {
      const key = `${target.from}\0${target.to}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      pairs.push({
        from: target.from,
        to: target.to,
      });
    }
    pairs.sort((left, right) => {
      const fromComparison = compareOrdinal(left.from, right.from);
      return fromComparison === 0
        ? compareOrdinal(left.to, right.to)
        : fromComparison;
    });
    return pairs;
  };

  return {
    externalDependencyPairs: buildOrientedPairs(
      local.externalDependencies ?? common?.externalDependencies,
      local.externalDependencies === undefined,
      isPathInTree
    ),
    foreignDomains: buildSortedPaths(
      local.foreignDomains ?? common?.foreignDomains,
      local.foreignDomains === undefined
    ),
    foreignNodes: buildForeignNodes(),
    horizontalHierarchies: buildHorizontalHierarchies(),
    horizontalHierarchyModels:
      local.horizontalHierarchyModels ??
      common?.horizontalHierarchyModels ??
      [],
    mimeticPathStructures: buildMimeticStructures(),
    publicRootNodes: buildSortedPaths(
      local.publicRootNodes ?? common?.publicRootNodes,
      local.publicRootNodes === undefined
    ),
    treeDependencyPairs: buildOrientedPairs(
      local.treeDependencies ?? common?.treeDependencies,
      local.treeDependencies === undefined,
      (from) => from === originPath
    ),
  };
};
