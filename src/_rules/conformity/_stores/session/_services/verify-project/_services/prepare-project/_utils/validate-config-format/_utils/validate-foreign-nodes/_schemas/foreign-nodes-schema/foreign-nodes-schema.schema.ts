import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const foreignNodesSchema = (() => {
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_TYPE = 'configuration/invalid-type';

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const literalPath = formFields.textValue().superRefine((value, context) => {
    if (!formFields.isLiteralPath(value)) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed(INVALID_PATH),
      });
    }
  });

  const fullPathArray = (): z.ZodType<readonly string[]> =>
    z
      .array(literalPath, {
        error: (issue) =>
          issue.input === undefined
            ? formFields.requiredAbsence()
            : formFields.fixed(INVALID_TYPE),
      })
      .min(1, {
        error: () => formFields.fixed(EMPTY_LIST),
      });

  const patternItem = formFields.textValue();

  const familySchema = z.strictObject(
    {
      paths: fullPathArray(),
      patterns: z
        .array(patternItem, {
          error: (issue) =>
            issue.input === undefined
              ? formFields.requiredAbsence()
              : formFields.fixed(INVALID_TYPE),
        })
        .min(1, {
          error: () => formFields.fixed(EMPTY_LIST),
        }),
    },
    {
      error: (issue) =>
        issue.code === 'unrecognized_keys'
          ? formFields.encode({
              constraint: 'configuration/unknown-property',
              kind: 'keys',
            })
          : formFields.fixed(INVALID_TYPE),
    }
  );

  const foreignString = formFields.textValue().superRefine((value, context) => {
    if (!formFields.isLiteralPath(value)) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed(INVALID_PATH),
      });
    }
  });

  const foreignNodeItem = z.unknown().superRefine((item, context) => {
    if (item === null) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed('configuration/null-forbidden'),
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
      message: formFields.fixed(INVALID_TYPE),
    });
  });

  const loosePathList = z.array(literalPath, {
    error: () => formFields.fixed(INVALID_TYPE),
  });

  return {
    domains: loosePathList,
    nodes: z.array(foreignNodeItem, {
      error: () => formFields.fixed(INVALID_TYPE),
    }),
  };
})();
