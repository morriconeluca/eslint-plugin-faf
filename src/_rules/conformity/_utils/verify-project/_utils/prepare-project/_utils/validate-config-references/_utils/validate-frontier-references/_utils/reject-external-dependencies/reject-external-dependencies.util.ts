import type { TFAFExternalDependency } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { rejectReferenceScope } from '../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

export function rejectExternalDependencies(
  dependencies: readonly TFAFExternalDependency[],
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const rejectExternalSource = (
    path: string,
    propertyPath: string
  ): readonly TConfigOutcome[] =>
    rejectReferenceScope({
      context,
      expectedKind: 'file',
      label: 'External dependency source',
      path,
      propertyPath,
      scope,
    });

  const rejectExternalTarget = (
    path: string,
    propertyPath: string
  ): readonly TConfigOutcome[] => {
    if (
      context.aliasPrefixes.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`)
      )
    ) {
      return [
        createOutcome('configuration/external-dependency-to-alias', {
          element: path,
          propertyPath,
        }),
      ];
    }
    if (path.split('/').includes('node_modules')) {
      return [
        createOutcome('configuration/external-dependency-to-library', {
          element: path,
          propertyPath,
        }),
      ];
    }

    const id = context.inventory.pathToId.get(path);
    if (id === undefined) {
      return [
        createOutcome('configuration/non-existent-path', {
          detail: `External dependency target "${path}" does not exist under configuration base "${context.baseDirectory}".`,
          element: path,
          propertyPath,
        }),
      ];
    }
    const item = context.inventory.items[id];
    if (item === undefined) {
      return [
        createOutcome('configuration/expected-file', {
          detail: `External dependency target "${path}" is not a resolved file in the inventory.`,
          element: path,
          propertyPath,
        }),
      ];
    }
    if (item.kind !== 'file') {
      return [
        createOutcome('configuration/expected-file', {
          detail: `External dependency target "${path}" must be a file.`,
          element: path,
          propertyPath,
        }),
      ];
    }
    if (item.treeOrigin !== null) {
      return [
        createOutcome('configuration/external-dependency-to-inside-tree', {
          element: path,
          propertyPath,
        }),
      ];
    }
    return [];
  };

  return dependencies.flatMap((dependency, index) => {
    const prefix = `${basePath}[${index}]`;
    return [
      ...dependency.from.flatMap((path, fromIndex) =>
        rejectExternalSource(path, `${prefix}.from[${fromIndex}]`)
      ),
      ...dependency.to.flatMap((path, toIndex) =>
        rejectExternalTarget(path, `${prefix}.to[${toIndex}]`)
      ),
    ];
  });
}
