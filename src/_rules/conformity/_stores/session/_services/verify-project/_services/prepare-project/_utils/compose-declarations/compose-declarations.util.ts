import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TConfigOutcome,
  TResult,
} from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TEffectiveDeclarations,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { composeCatalog } from './_utils/compose-catalog/index.js';
import { composeRootFragments } from './_utils/compose-root-fragments/index.js';
import { filterByTreeContainment } from './_utils/filter-by-tree-containment/index.js';
import {
  type TOriginEntry,
  validateOrigins,
} from './_utils/validate-origins/index.js';

export const composeDeclarations = (
  config: TFAFConfig,
  baseDirectory: string
): TResult<TEffectiveDeclarations> => {
  const collectOrigins = (): readonly TOriginEntry[] => {
    const origins: TOriginEntry[] = [];
    for (const [localIndex, local] of config.faf.locals.entries()) {
      if (local.rootLayers !== undefined) {
        for (const [layerIndex, layer] of local.rootLayers.entries()) {
          origins.push({
            kind: 'root-layer',
            path: layer,
            propertyPath: `faf.locals[${localIndex}].rootLayers[${layerIndex}]`,
          });
        }
      }
      if (local.rootFragments !== undefined) {
        for (const [fragIndex, frag] of local.rootFragments.entries()) {
          origins.push({
            kind: 'root-fragment',
            path: frag.path,
            propertyPath: `faf.locals[${localIndex}].rootFragments[${fragIndex}]`,
          });
        }
      }
    }
    return origins;
  };

  const checkMissingRoles = (): readonly TConfigOutcome[] => {
    const outcomes: TConfigOutcome[] = [];
    for (const [localIndex, local] of config.faf.locals.entries()) {
      if (
        local.roles === undefined &&
        (config.faf.common === undefined ||
          config.faf.common.roles === undefined)
      ) {
        outcomes.push(
          createOutcome('configuration/missing-roles', {
            element: 'fafconfig.ts',
            propertyPath: `faf.locals[${localIndex}]`,
          })
        );
      }
    }
    return outcomes;
  };

  const originEntries = collectOrigins();
  const originOutcomes = validateOrigins(originEntries);
  const rolesOutcomes = checkMissingRoles();

  const allOutcomes = [...originOutcomes, ...rolesOutcomes];
  if (allOutcomes.length > 0) {
    return {
      ok: false,
      outcomes: allOutcomes,
    };
  }

  const buildTrees = (): readonly TEffectiveTree[] => {
    const resultTrees: TEffectiveTree[] = [];
    for (const local of config.faf.locals) {
      const roles = local.roles ?? config.faf.common?.roles ?? [];
      const subGraphRoles =
        local.subGraphRoles ?? config.faf.common?.subGraphRoles ?? [];
      const catalog = composeCatalog(roles, subGraphRoles);

      if (local.rootLayers !== undefined) {
        for (const originPath of local.rootLayers) {
          const scoped = filterByTreeContainment(
            originPath,
            config.faf.common,
            local
          );
          resultTrees.push({
            catalog,
            externalDependencyPairs: scoped.externalDependencyPairs,
            foreignDomains: scoped.foreignDomains,
            foreignNodes: scoped.foreignNodes,
            horizontalHierarchies: scoped.horizontalHierarchies,
            localHorizontalHierarchies: scoped.localHorizontalHierarchies,
            mimeticPathStructures: scoped.mimeticPathStructures,
            originKind: 'root-layer',
            originPath,
            publicRootNodes: scoped.publicRootNodes,
            rootFragments: [],
            treeDependencyPairs: scoped.treeDependencyPairs,
          });
        }
      }

      if (local.rootFragments !== undefined) {
        for (const rootFragment of local.rootFragments) {
          const originPath = rootFragment.path;
          const scoped = filterByTreeContainment(
            originPath,
            config.faf.common,
            local
          );
          resultTrees.push({
            catalog,
            externalDependencyPairs: scoped.externalDependencyPairs,
            foreignDomains: scoped.foreignDomains,
            foreignNodes: scoped.foreignNodes,
            horizontalHierarchies: scoped.horizontalHierarchies,
            localHorizontalHierarchies: scoped.localHorizontalHierarchies,
            mimeticPathStructures: scoped.mimeticPathStructures,
            originKind: 'root-fragment',
            originPath,
            publicRootNodes: scoped.publicRootNodes,
            rootFragments: composeRootFragments([rootFragment]),
            treeDependencyPairs: scoped.treeDependencyPairs,
          });
        }
      }
    }
    return resultTrees;
  };

  return {
    ok: true,
    value: {
      aliases: [],
      baseDirectory,
      trees: buildTrees(),
    },
  };
};
