import type {
  TFAFCommonConfig,
  TFAFForeignNodeFamily,
  TFAFLocalConfig,
} from '../../../../../_domain/_types/faf-config.type.js';
import type {
  TEffectiveForeignFamily,
  TEffectiveForeignNodes,
  TEffectiveLocalHierarchy,
  TEffectiveMimeticStructure,
  TEffectiveOrientedPair,
} from '../../../../_types/declarations.type.js';
import type { TTreeScopedDeclarations } from './filter-by-tree-containment.type.js';

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

    const individualPaths: string[] = [];
    for (const item of stringItems) {
      if (isInherited && !isPathInTree(item)) {
        continue;
      }

      const insertIndex = individualPaths.findIndex(
        (p) => p.localeCompare(item) > 0
      );
      if (insertIndex === -1) {
        individualPaths.push(item);
      } else {
        individualPaths.splice(insertIndex, 0, item);
      }
    }

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

  const buildPublicRootNodes = (): readonly string[] => {
    const rawNodes = local.publicRootNodes ?? common?.publicRootNodes;
    if (rawNodes === undefined) {
      return [];
    }
    const isInherited = local.publicRootNodes === undefined;
    const result: string[] = [];
    for (const p of rawNodes) {
      if (isInherited && !isPathInTree(p)) {
        continue;
      }

      const insertIndex = result.findIndex(
        (existing) => existing.localeCompare(p) > 0
      );
      if (insertIndex === -1) {
        result.push(p);
      } else {
        result.splice(insertIndex, 0, p);
      }
    }
    return result;
  };

  const buildForeignDomains = (): readonly string[] => {
    const rawDomains = local.foreignDomains ?? common?.foreignDomains;
    if (rawDomains === undefined) {
      return [];
    }
    const isInherited = local.foreignDomains === undefined;
    const result: string[] = [];
    for (const d of rawDomains) {
      if (isInherited && !isPathInTree(d)) {
        continue;
      }

      const insertIndex = result.findIndex(
        (existing) => existing.localeCompare(d) > 0
      );
      if (insertIndex === -1) {
        result.push(d);
      } else {
        result.splice(insertIndex, 0, d);
      }
    }
    return result;
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

        const newPair: TEffectiveOrientedPair = {
          from: target.from,
          to: target.to,
        };
        const insertIndex = pairs.findIndex((p) => {
          const comparison = p.from.localeCompare(newPair.from);
          return (
            comparison > 0 ||
            (comparison === 0 && p.to.localeCompare(newPair.to) > 0)
          );
        });
        if (insertIndex === -1) {
          pairs.push(newPair);
        } else {
          pairs.splice(insertIndex, 0, newPair);
        }
      }
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

      const newPair: TEffectiveOrientedPair = {
        from: target.from,
        to: target.to,
      };
      const insertIndex = pairs.findIndex((p) => {
        const comparison = p.from.localeCompare(newPair.from);
        return (
          comparison > 0 ||
          (comparison === 0 && p.to.localeCompare(newPair.to) > 0)
        );
      });
      if (insertIndex === -1) {
        pairs.push(newPair);
      } else {
        pairs.splice(insertIndex, 0, newPair);
      }
    }
    return pairs;
  };

  return {
    externalDependencyPairs: buildExternalDependencyPairs(),
    foreignDomains: buildForeignDomains(),
    foreignNodes: buildForeignNodes(),
    horizontalHierarchies:
      local.horizontalHierarchies ?? common?.horizontalHierarchies ?? [],
    localHorizontalHierarchies: buildLocalHierarchies(),
    mimeticPathStructures: buildMimeticStructures(),
    publicRootNodes: buildPublicRootNodes(),
    treeDependencyPairs: buildTreeDependencyPairs(),
  };
};
