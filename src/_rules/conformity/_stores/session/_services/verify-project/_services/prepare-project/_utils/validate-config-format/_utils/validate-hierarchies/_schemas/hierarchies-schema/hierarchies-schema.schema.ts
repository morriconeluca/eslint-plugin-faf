import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const hierarchiesSchema = (() => {
  const EMPTY_TIER = 'configuration/empty-tier';
  const INSUFFICIENT_TIERS = 'configuration/insufficient-hierarchy-tiers';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_SUB_CATEGORY = 'configuration/invalid-sub-category-name';
  const SUB_CATEGORY_NAME_PATTERN = /^_[a-z0-9]+(?:-[a-z0-9]+)*$/u;

  const subCategoryItemSchema = formFields
    .textValue()
    .superRefine((value, context) => {
      if (value.length > 0 && !SUB_CATEGORY_NAME_PATTERN.test(value)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(INVALID_SUB_CATEGORY),
        });
      }
    });

  const subCategoryTierSchema = z
    .array(subCategoryItemSchema, {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(1, {
      error: () => formFields.fixed(EMPTY_TIER),
    });

  const subCategoryHierarchySchema = z
    .array(subCategoryTierSchema, {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(2, {
      error: () => formFields.fixed(INSUFFICIENT_TIERS),
    });

  const subCategoryHierarchiesSchema = z.array(subCategoryHierarchySchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });

  const domainTierSchema = z
    .array(formFields.textValue(), {
      error: (issue) => formFields.nullOrType(issue.input),
    })
    .min(1, {
      error: () => formFields.fixed(EMPTY_TIER),
    });

  const requiredDomainHierarchySchema = z
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
      hierarchy: requiredDomainHierarchySchema,
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
    subCategory: subCategoryHierarchiesSchema,
  };
})();
