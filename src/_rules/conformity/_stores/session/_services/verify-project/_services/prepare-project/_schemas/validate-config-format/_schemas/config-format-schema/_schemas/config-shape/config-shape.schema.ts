import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const configShape = (() => {
  const CONFIG_1 = 'CONFIG_1';
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_5 = 'CONFIG_5';
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
    Object.fromEntries(
      keys.map((key) => [key, formFields.optionalProperty(key)])
    );

  const keysDiagnostic = (
    messageStyle: 'faf' | 'plain' | 'root',
    normativeReference: string
  ): string =>
    formFields.encode({
      constraint: 'configuration/unknown-property',
      kind: 'keys',
      messageStyle,
      normativeReference,
    });

  const fixedOrigin = (
    constraint: `configuration/${string}`,
    message: string,
    path: readonly PropertyKey[]
  ): { readonly message: string; readonly path: readonly PropertyKey[] } => ({
    message: formFields.fixed(constraint, CONFIG_5, message),
    path,
  });

  const soleOrigin = (
    value: unknown,
    key: 'rootFragments' | 'rootLayers',
    message: string
  ): null | {
    readonly message: string;
    readonly path: readonly PropertyKey[];
  } =>
    Array.isArray(value) && value.length === 0
      ? fixedOrigin(EMPTY_LIST, message, [key])
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
      return fixedOrigin(
        MISSING_ORIGIN,
        'Local configuration must declare at least one origin via "rootLayers" or "rootFragments".',
        []
      );
    }
    if (hasLayers && hasFragments) {
      const areBothEmpty =
        Array.isArray(local.rootLayers) &&
        local.rootLayers.length === 0 &&
        Array.isArray(local.rootFragments) &&
        local.rootFragments.length === 0;
      return areBothEmpty
        ? fixedOrigin(
            MISSING_ORIGIN,
            'Both "rootLayers" and "rootFragments" are empty; at least one non-empty origin must be provided.',
            []
          )
        : null;
    }
    return hasLayers
      ? soleOrigin(
          local.rootLayers,
          'rootLayers',
          'Origin list "rootLayers" cannot be empty when it is the sole origin.'
        )
      : soleOrigin(
          local.rootFragments,
          'rootFragments',
          'Origin list "rootFragments" cannot be empty when it is the sole origin.'
        );
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
        error: (issue) => {
          return issue.code === 'unrecognized_keys'
            ? keysDiagnostic('plain', CONFIG_2)
            : formFields.nullOrType(
                issue.input,
                'Local configuration element cannot be null.',
                'Local configuration element must be an object.',
                CONFIG_2
              );
        },
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
          return keysDiagnostic('plain', CONFIG_2);
        }
        if (issue.input === undefined) {
          return formFields.fixed(
            'configuration/explicit-undefined',
            CONFIG_2,
            'Property "common" cannot be explicitly undefined.'
          );
        }
        return formFields.nullOrType(
          issue.input,
          'Property "common" cannot be null.',
          'Property "common" must be an object.',
          CONFIG_2
        );
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
              ? formFields.requiredAbsence(
                  'locals',
                  'Property "locals" must be an array.',
                  CONFIG_2,
                  CONFIG_2
                )
              : formFields.nullOrType(
                  issue.input,
                  'Property "locals" cannot be null.',
                  'Property "locals" must be an array.',
                  CONFIG_2
                ),
        })
        .readonly(),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return keysDiagnostic('faf', CONFIG_2);
        }
        if (issue.input === undefined) {
          return formFields.requiredAbsence(
            'faf',
            'Property "faf" must be an object.',
            CONFIG_2,
            CONFIG_1
          );
        }
        return formFields.nullOrType(
          issue.input,
          'Property "faf" cannot be null.',
          'Property "faf" must be an object.',
          CONFIG_2
        );
      },
    }
  );

  return {
    root: z.strictObject(
      { faf: fafObject },
      {
        error: (issue) => {
          if (issue.code === 'unrecognized_keys') {
            return keysDiagnostic('root', CONFIG_1);
          }
          if (issue.input === null) {
            return formFields.fixed(
              'configuration/null-forbidden',
              CONFIG_1,
              'Configuration value cannot be null.'
            );
          }
          return formFields.fixed(
            'configuration/invalid-type',
            CONFIG_1,
            'Configuration value must be a plain object.'
          );
        },
      }
    ),
  };
})();
