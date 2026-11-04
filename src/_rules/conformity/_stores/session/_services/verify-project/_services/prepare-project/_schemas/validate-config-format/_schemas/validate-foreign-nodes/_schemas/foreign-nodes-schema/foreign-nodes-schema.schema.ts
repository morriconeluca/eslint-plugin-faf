import { z } from 'zod';

import { compileForeignPattern } from '../../../../../../../../_verify-project@shared/_utils/compile-foreign-pattern/index.js';
import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';

export const foreignNodesSchema = (() => {
  const ARRAY_MESSAGE = 'Property "{path}" must be an array.';
  const FAMILY_MESSAGE =
    'Foreign node element must be a string or a family object.';
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_6 = 'CONFIG_6';
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_PATTERN = 'configuration/invalid-foreign-pattern';
  const INVALID_TYPE = 'configuration/invalid-type';

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const literalPath = formFields
    .textValue(
      'Path element cannot be null.',
      'Path element must be a string.',
      'Path element cannot be empty.',
      CONFIG_2
    )
    .superRefine((value, context) => {
      if (!isLiteralConfigPath(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(
            INVALID_PATH,
            'CONFIG_2_2',
            `Invalid literal config path "${value}".`
          ),
        });
      }
    });

  const fullPathArray = (emptyNorm: string): z.ZodType<readonly string[]> =>
    z
      .array(literalPath, {
        error: (issue) =>
          issue.input === undefined
            ? formFields.requiredAbsence(
                'paths',
                ARRAY_MESSAGE,
                CONFIG_2,
                CONFIG_6
              )
            : formFields.fixed(INVALID_TYPE, CONFIG_2, ARRAY_MESSAGE),
      })
      .min(1, {
        error: () =>
          formFields.fixed(
            EMPTY_LIST,
            emptyNorm,
            'Property "{path}" cannot be empty.'
          ),
      });

  const patternItem = formFields
    .textValue(
      'Pattern element cannot be null.',
      'Pattern element must be a string.',
      'Pattern element cannot be empty.',
      CONFIG_2
    )
    .superRefine((value, context) => {
      const result = compileForeignPattern(value);
      if (!result.ok) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(
            INVALID_PATTERN,
            CONFIG_6,
            `Invalid foreign pattern "${value}": ${result.reason}.`
          ),
        });
      }
    });

  const familySchema = z.strictObject(
    {
      paths: fullPathArray(CONFIG_6),
      patterns: z
        .array(patternItem, {
          error: (issue) =>
            issue.input === undefined
              ? formFields.requiredAbsence(
                  'patterns',
                  'Property "patterns" must be an array.',
                  CONFIG_2,
                  CONFIG_6
                )
              : formFields.fixed(
                  INVALID_TYPE,
                  CONFIG_2,
                  'Property "patterns" must be an array.'
                ),
        })
        .min(1, {
          error: () =>
            formFields.fixed(
              EMPTY_LIST,
              CONFIG_6,
              'Property "patterns" cannot be empty.'
            ),
        }),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
            messageStyle: 'plain',
            normativeReference: CONFIG_6,
          });
        }
        return formFields.fixed(INVALID_TYPE, CONFIG_2, FAMILY_MESSAGE);
      },
    }
  );

  const foreignString = formFields
    .textValue(
      'Foreign node element cannot be null.',
      FAMILY_MESSAGE,
      'Foreign node path cannot be empty.',
      CONFIG_2
    )
    .superRefine((value, context) => {
      if (!isLiteralConfigPath(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(
            INVALID_PATH,
            'CONFIG_2_2',
            `Invalid literal config path "${value}".`
          ),
        });
      }
    });

  const foreignNodeItem = z.unknown().superRefine((item, context) => {
    if (item === null) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed(
          'configuration/null-forbidden',
          CONFIG_2,
          'Foreign node element cannot be null.'
        ),
      });
      return;
    }
    if (typeof item === 'string') {
      const parsed = foreignString.safeParse(item);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          context.addIssue({ ...issue, path: [...issue.path] });
        }
      }
      return;
    }
    if (isRecord(item)) {
      const parsed = familySchema.safeParse(item);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          context.addIssue({ ...issue, path: [...issue.path] });
        }
      }
      return;
    }
    context.addIssue({
      code: 'custom',
      message: formFields.fixed(INVALID_TYPE, CONFIG_2, FAMILY_MESSAGE),
    });
  });

  const loosePathList = z.array(literalPath, {
    error: () => formFields.fixed(INVALID_TYPE, CONFIG_2, ARRAY_MESSAGE),
  });

  return {
    domains: loosePathList,
    nodes: z.array(foreignNodeItem, {
      error: () =>
        formFields.fixed(
          INVALID_TYPE,
          CONFIG_2,
          'Property "foreignNodes" must be an array.'
        ),
    }),
  };
})();
