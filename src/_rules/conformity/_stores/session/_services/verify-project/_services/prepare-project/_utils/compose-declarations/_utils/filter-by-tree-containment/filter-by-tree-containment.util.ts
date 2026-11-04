import type {
  TFAFCommonConfig,
  TFAFForeignNodeFamily,
  TFAFLocalConfig,
} from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveForeignFamily,
  TEffectiveForeignNodes,
  TEffectiveLocalHierarchy,
  TEffectiveMimeticStructure,
  TEffectiveOrientedPair,
} from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
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
        ? item.paths.filter((p: string) => isPathInTree(p))
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

  const buildLocalHierarchies = (): readonly TEffectiveLocalHierarchy[] => {
    if (local.localHorizontalHierarchies !== undefined) {
      return local.localHorizontalHierarchies.map((h) => ({
        hierarchy: h.hierarchies,
        paths: [...h.paths],
      }));
    }

    if (common?.localHorizontalHierarchies === undefined) {
      return [];
    }

    const result: TEffectiveLocalHierarchy[] = [];
    for (const h of common.localHorizontalHierarchies) {
      const filteredPaths = h.paths.filter((p: string) => isPathInTree(p));
      if (filteredPaths.length > 0) {
        result.push({
          hierarchy: h.hierarchies,
          paths: filteredPaths,
        });
      }
    }
    return result;
  };

  const buildMimeticStructures = (): readonly TEffectiveMimeticStructure[] => {
    if (local.mimeticPathStructures !== undefined) {
      return local.mimeticPathStructures.map((m) => ({
        actions: m.actions === undefined ? null : [...m.actions],
        paths: [...m.paths],
      }));
    }

    if (common?.mimeticPathStructures === undefined) {
      return [];
    }

    const result: TEffectiveMimeticStructure[] = [];
    for (const m of common.mimeticPathStructures) {
      const filteredPaths = m.paths.filter((p: string) => isPathInTree(p));
      if (filteredPaths.length > 0) {
        result.push({
          actions: m.actions === undefined ? null : [...m.actions],
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

  const buildExternalDependencyPairs =
    (): readonly TEffectiveOrientedPair[] => {
      const rawEdges =
        local.externalDependencies ?? common?.externalDependencies;
      if (rawEdges === undefined) {
        return [];
      }
      const isInherited = local.externalDependencies === undefined;
      const flatTargets = rawEdges.flatMap((edge) =>
        edge.from.flatMap((from) =>
          isInherited && !isPathInTree(from)
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

  const buildTreeDependencyPairs = (): readonly TEffectiveOrientedPair[] => {
    const rawEdges = local.treeDependencies ?? common?.treeDependencies;
    if (rawEdges === undefined) {
      return [];
    }
    const isInherited = local.treeDependencies === undefined;
    const flatTargets = rawEdges.flatMap((edge) =>
      edge.from.flatMap((from) =>
        isInherited && from !== originPath
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
    externalDependencyPairs: buildExternalDependencyPairs(),
    foreignDomains: buildSortedPaths(
      local.foreignDomains ?? common?.foreignDomains,
      local.foreignDomains === undefined
    ),
    foreignNodes: buildForeignNodes(),
    horizontalHierarchies:
      local.horizontalHierarchies ?? common?.horizontalHierarchies ?? [],
    localHorizontalHierarchies: buildLocalHierarchies(),
    mimeticPathStructures: buildMimeticStructures(),
    publicRootNodes: buildSortedPaths(
      local.publicRootNodes ?? common?.publicRootNodes,
      local.publicRootNodes === undefined
    ),
    treeDependencyPairs: buildTreeDependencyPairs(),
  };
};
