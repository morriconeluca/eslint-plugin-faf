import type { TFAFTreeDependency } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TOwnedOrigin,
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export const rejectTreeDependencies = (() => {
  const rejectTreeDependencySource = (
    path: string,
    propertyPath: string,
    scope: TScopeBinding,
    owned: TOwnedOrigin | undefined
  ): readonly TConfigOutcome[] => {
    if (owned === undefined) {
      return [
        createOutcome('configuration/tree-dependency-not-tree-origin', {
          element: path,
          propertyPath,
        }),
      ];
    }
    if (scope.kind !== 'local') {
      return [];
    }
    if (owned.localIndex !== scope.localIndex) {
      return [
        createOutcome('configuration/tree-dependency-from-outside-scope', {
          element: path,
          propertyPath,
        }),
      ];
    }
    return [];
  };

  const rejectTreeDependencyEnd = (
    path: string,
    propertyPath: string,
    endKind: 'source' | 'target',
    scope: TScopeBinding,
    context: TReferenceContext
  ): readonly TConfigOutcome[] => {
    const id = context.inventory.pathToId.get(path);
    if (id === undefined) {
      return [
        createOutcome('configuration/non-existent-path', {
          detail: `Tree dependency ${endKind} "${path}" does not exist under configuration base "${context.baseDirectory}".`,
          element: path,
          propertyPath,
        }),
      ];
    }
    const item = context.inventory.items[id];
    if (item === undefined) {
      return [
        createOutcome('configuration/expected-directory', {
          detail: `Tree dependency ${endKind} "${path}" is not a resolved directory in the inventory.`,
          element: path,
          propertyPath,
        }),
      ];
    }
    if (item.kind !== 'directory') {
      return [
        createOutcome('configuration/expected-directory', {
          detail: `Tree dependency ${endKind} "${path}" must be a directory.`,
          element: path,
          propertyPath,
        }),
      ];
    }

    const owned = context.ownedOrigins.get(path);
    if (endKind === 'source') {
      return rejectTreeDependencySource(path, propertyPath, scope, owned);
    }
    if (owned !== undefined || item.treeOrigin === path) {
      return [];
    }
    return [
      createOutcome('configuration/tree-dependency-not-tree-origin', {
        element: path,
        propertyPath,
      }),
    ];
  };

  const rejectOneTreeDependency = (
    dependency: TFAFTreeDependency,
    prefix: string,
    scope: TScopeBinding,
    context: TReferenceContext
  ): readonly TConfigOutcome[] => {
    const fromOutcomes = dependency.from.flatMap((path, index) =>
      rejectTreeDependencyEnd(
        path,
        `${prefix}.from[${index}]`,
        'source',
        scope,
        context
      )
    );
    const toOutcomes = dependency.to.flatMap((path, index) =>
      rejectTreeDependencyEnd(
        path,
        `${prefix}.to[${index}]`,
        'target',
        scope,
        context
      )
    );
    const selfOutcomes: TConfigOutcome[] = [];
    for (const [index, path] of dependency.to.entries()) {
      if (dependency.from.includes(path)) {
        selfOutcomes.push(
          createOutcome('configuration/tree-dependency-self', {
            element: path,
            propertyPath: `${prefix}.to[${index}]`,
          })
        );
      }
    }
    return [...fromOutcomes, ...toOutcomes, ...selfOutcomes];
  };

  return function rejectTreeDependencies(
    dependencies: readonly TFAFTreeDependency[],
    basePath: string,
    scope: TScopeBinding,
    context: TReferenceContext
  ): readonly TConfigOutcome[] {
    return dependencies.flatMap((dependency, index) =>
      rejectOneTreeDependency(
        dependency,
        `${basePath}[${index}]`,
        scope,
        context
      )
    );
  };
})();
