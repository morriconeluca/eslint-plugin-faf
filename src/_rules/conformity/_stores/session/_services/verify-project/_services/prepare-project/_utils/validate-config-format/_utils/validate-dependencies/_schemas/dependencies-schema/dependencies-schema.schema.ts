import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const dependenciesSchema = (() => {
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_TYPE = 'configuration/invalid-type';
  const NULL_FORBIDDEN = 'configuration/null-forbidden';

  const pathItem = formFields.textValue().superRefine((value, context) => {
    if (!formFields.isLiteralPath(value)) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed(INVALID_PATH),
      });
    }
  });

  const requiredEndpoint = (): z.ZodType<readonly string[]> =>
    z
      .array(pathItem, {
        error: (issue) => {
          if (issue.input === undefined) {
            return formFields.requiredAbsence();
          }
          if (issue.input === null) {
            return formFields.fixed(NULL_FORBIDDEN);
          }
          return formFields.fixed(INVALID_TYPE);
        },
      })
      .min(1, {
        error: () => formFields.fixed(EMPTY_LIST),
      });

  const pairSchema = z.strictObject(
    {
      from: requiredEndpoint(),
      to: requiredEndpoint(),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
          });
        }
        return formFields.nullOrType(issue.input);
      },
    }
  );

  const pairList = z.array(pairSchema, {
    error: (issue) =>
      formFields.fixed(issue.input === null ? NULL_FORBIDDEN : INVALID_TYPE),
  });

  return {
    pairs: pairList,
    publicRootNodes: z.array(pathItem, {
      error: () => formFields.fixed(INVALID_TYPE),
    }),
  };
})();
