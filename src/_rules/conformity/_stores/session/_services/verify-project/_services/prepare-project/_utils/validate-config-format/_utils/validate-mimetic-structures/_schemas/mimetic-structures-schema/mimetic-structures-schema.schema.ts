import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const mimeticStructuresSchema = (() => {
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_PATH = 'configuration/invalid-literal-path';

  const pathItem = formFields.textValue().superRefine((value, context) => {
    if (!formFields.isLiteralPath(value)) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed(INVALID_PATH),
      });
    }
  });

  const actionItem = formFields.textValue();

  const structureSchema = z.strictObject(
    {
      actions: z
        .array(actionItem, {
          error: (issue) => formFields.presenceIssue(issue.input),
        })
        .min(1, {
          error: () => formFields.fixed(EMPTY_LIST),
        })
        .exactOptional(),
      paths: z
        .array(pathItem, {
          error: (issue) =>
            issue.input === undefined
              ? formFields.requiredAbsence()
              : formFields.nullOrType(issue.input),
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
          : formFields.nullOrType(issue.input),
    }
  );

  return z.array(structureSchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });
})();
