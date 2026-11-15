import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const hierarchiesSchema = (() => {
  const EMPTY_TIER = 'configuration/empty-tier';
  const INSUFFICIENT_TIERS = 'configuration/insufficient-hierarchy-tiers';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_SUB_CATEGORY = 'configuration/invalid-sub-category-name';
  const SUB_CATEGORY_NAME_PATTERN = /^_[a-z0-9]+(?:-[a-z0-9]+)*$/u;

  const modelMemberSchema = formFields
    .textValue()
    .superRefine((value, context) => {
      if (value.length > 0 && !SUB_CATEGORY_NAME_PATTERN.test(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(INVALID_SUB_CATEGORY),
        });
      }
    });

  const modelTierSchema = z
    .array(modelMemberSchema, {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(1, {
      error: () => formFields.fixed(EMPTY_TIER),
    });

  const horizontalHierarchyModelSchema = z
    .array(modelTierSchema, {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(2, {
      error: () => formFields.fixed(INSUFFICIENT_TIERS),
    });

  const horizontalHierarchyModelsSchema = z.array(
    horizontalHierarchyModelSchema,
    {
      error: (issue) => formFields.nullOrType(issue.input),
    }
  );

  const domainTierSchema = z
    .array(formFields.textValue(), {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(1, {
      error: () => formFields.fixed(EMPTY_TIER),
    });

  const requiredHorizontalHierarchySchema = z
    .array(domainTierSchema, {
      error: (issue) =>
        issue.input === undefined
          ? formFields.requiredAbsence()
          : formFields.nullOrType(issue.input),
    })
    .min(2, {
      error: () => formFields.fixed(INSUFFICIENT_TIERS),
    });

  const requiredPathSchema = formFields
    .requiredText()
    .superRefine((value, context) => {
      if (value.length > 0 && !formFields.isLiteralPath(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(INVALID_PATH),
        });
      }
    });

  const horizontalHierarchyEntrySchema = z.strictObject(
    {
      hierarchy: requiredHorizontalHierarchySchema,
      path: requiredPathSchema,
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

  const horizontalHierarchiesSchema = z.array(horizontalHierarchyEntrySchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });

  return {
    horizontal: horizontalHierarchiesSchema,
    models: horizontalHierarchyModelsSchema,
  };
})();
