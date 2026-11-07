import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const rootFragmentsSchema = (() => {
  const EMPTY_LIST = 'configuration/empty-list';
  const EMPTY_TIER = 'configuration/empty-tier';
  const INVALID_FILE = 'configuration/invalid-file-name';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_TYPE = 'configuration/invalid-type';
  const NULL_FORBIDDEN = 'configuration/null-forbidden';

  const fileName = (): z.ZodType<string> =>
    formFields.textValue().superRefine((value, context) => {
      if (value.includes('/') || !formFields.isLiteralPath(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(INVALID_FILE),
        });
      }
    });

  const literalPath = formFields.textValue().superRefine((value, context) => {
    if (!formFields.isLiteralPath(value)) {
      context.addIssue({
        code: 'custom',
        message: formFields.fixed(INVALID_PATH),
      });
    }
  });

  const nonEmptyNames = (
    item: z.ZodType<string>
  ): z.ZodType<readonly string[]> =>
    z
      .array(item, {
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

  const edgeSchema = z.strictObject(
    {
      from: nonEmptyNames(fileName()),
      to: nonEmptyNames(literalPath),
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

  const tierSchema = z
    .array(fileName(), {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(1, {
      error: () => formFields.fixed(EMPTY_TIER),
    });

  const fragmentShape = {
    dependencyEdges: z
      .array(edgeSchema, {
        error: (issue) => formFields.presenceIssue(issue.input),
      })
      .exactOptional(),
    path: formFields.requiredText().superRefine((value, context) => {
      if (value.length > 0 && !formFields.isLiteralPath(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(INVALID_PATH),
        });
      }
    }),
    rootNodes: z.array(tierSchema, {
      error: (issue) =>
        issue.input === undefined
          ? formFields.requiredAbsence()
          : formFields.nullOrType(issue.input),
    }),
  };

  const rootFragmentSchema: z.ZodType = z.lazy(() =>
    z.strictObject(
      {
        ...fragmentShape,
        subRootFragments: z.array(rootFragmentSchema).exactOptional(),
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
    )
  );

  return z.array(rootFragmentSchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });
})();
