import { z } from 'zod';

import type { TConfigConstraint } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const configShape = (() => {
  const EMPTY_LIST = 'configuration/empty-list';
  const MISSING_ORIGIN = 'configuration/missing-origin';

  const SHARED_KEYS = [
    'externalDependencies',
    'foreignDomains',
    'foreignNodes',
    'horizontalHierarchies',
    'localHorizontalHierarchies',
    'mimeticPathStructures',
    'publicRootNodes',
    'roles',
    'subGraphRoles',
    'treeDependencies',
  ] as const;

  const shapeOf = (keys: readonly string[]): z.ZodRawShape =>
    Object.fromEntries(keys.map((key) => [key, formFields.optionalProperty()]));

  const keysDiagnostic = (): string =>
    formFields.encode({
      constraint: 'configuration/unknown-property',
      kind: 'keys',
    });

  const fixedOrigin = (
    constraint: TConfigConstraint,
    path: readonly PropertyKey[]
  ): { readonly message: string; readonly path: readonly PropertyKey[] } => ({
    message: formFields.fixed(constraint),
    path,
  });

  const soleOrigin = (
    value: unknown,
    key: 'rootFragments' | 'rootLayers'
  ): null | {
    readonly message: string;
    readonly path: readonly PropertyKey[];
  } =>
    Array.isArray(value) && value.length === 0
      ? fixedOrigin(EMPTY_LIST, [key])
      : null;

  const originIssue = (local: {
    readonly rootFragments?: unknown;
    readonly rootLayers?: unknown;
  }): null | {
    readonly message: string;
    readonly path: readonly PropertyKey[];
  } => {
    const hasLayers = local.rootLayers !== undefined;
    const hasFragments = local.rootFragments !== undefined;
    if (!hasLayers && !hasFragments) {
      return fixedOrigin(MISSING_ORIGIN, []);
    }
    if (hasLayers && hasFragments) {
      const areBothEmpty =
        Array.isArray(local.rootLayers) &&
        local.rootLayers.length === 0 &&
        Array.isArray(local.rootFragments) &&
        local.rootFragments.length === 0;
      return areBothEmpty ? fixedOrigin(MISSING_ORIGIN, []) : null;
    }
    return hasLayers
      ? soleOrigin(local.rootLayers, 'rootLayers')
      : soleOrigin(local.rootFragments, 'rootFragments');
  };

  const localObject = z
    .strictObject(
      {
        ...shapeOf(SHARED_KEYS),
        aliases: z.any().optional(),
        rootFragments: z.any().optional(),
        rootLayers: z.any().optional(),
      },
      {
        error: (issue) =>
          issue.code === 'unrecognized_keys'
            ? keysDiagnostic()
            : formFields.nullOrType(issue.input),
      }
    )
    .superRefine((local, context) => {
      const issue = originIssue(local);
      if (issue !== null) {
        context.addIssue({
          code: 'custom',
          message: issue.message,
          path: [...issue.path],
        });
      }
    });

  const commonObject = z.strictObject(
    {
      ...shapeOf(['aliases', ...SHARED_KEYS]),
      rootFragments: z.any().optional(),
      rootLayers: z.any().optional(),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return keysDiagnostic();
        }
        if (issue.input === undefined) {
          return formFields.fixed('configuration/explicit-undefined');
        }
        return formFields.nullOrType(issue.input);
      },
    }
  );

  const fafObject = z.strictObject(
    {
      common: commonObject.exactOptional(),
      locals: z
        .array(localObject, {
          error: (issue) =>
            issue.input === undefined
              ? formFields.requiredAbsence()
              : formFields.nullOrType(issue.input),
        })
        .readonly(),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return keysDiagnostic();
        }
        if (issue.input === undefined) {
          return formFields.requiredAbsence();
        }
        return formFields.nullOrType(issue.input);
      },
    }
  );

  return {
    root: z.strictObject(
      { faf: fafObject },
      {
        error: (issue) =>
          issue.code === 'unrecognized_keys'
            ? keysDiagnostic()
            : formFields.nullOrType(issue.input),
      }
    ),
  };
})();
