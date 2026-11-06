import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';

export const hierarchiesSchema = (() => {
  const EMPTY_LIST = 'configuration/empty-list';
  const EMPTY_TIER = 'configuration/empty-tier';
  const INVALID_PATH = 'configuration/invalid-literal-path';

  const hierarchyItemSchema = formFields.textValue();

  const tierSchema = z
    .array(hierarchyItemSchema, {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(1, {
      error: () => formFields.fixed(EMPTY_TIER),
    });

  const hierarchySchema = z.array(tierSchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });

  const requiredHierarchySchema = z.array(tierSchema, {
    error: (issue) =>
      issue.input === undefined
        ? formFields.requiredAbsence()
        : formFields.nullOrType(issue.input),
  });

  const horizontalHierarchiesSchema = z.array(hierarchySchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });

  const pathItemSchema = formFields
    .textValue()
    .superRefine((value, context) => {
      if (!isLiteralConfigPath(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(INVALID_PATH),
        });
      }
    });

  const requiredPaths = z
    .array(pathItemSchema, {
      error: (issue) =>
        issue.input === undefined
          ? formFields.requiredAbsence()
          : formFields.nullOrType(issue.input),
    })
    .min(1, {
      error: () => formFields.fixed(EMPTY_LIST),
    });

  const localHierarchySchema = z.strictObject(
    {
      hierarchies: requiredHierarchySchema,
      paths: requiredPaths,
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

  const localHorizontalHierarchiesSchema = z.array(localHierarchySchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });

  return {
    horizontal: horizontalHierarchiesSchema,
    local: localHorizontalHierarchiesSchema,
  };
})();
