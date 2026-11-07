import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const rolesSchema = (() => {
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_TYPE = 'configuration/invalid-type';

  const roleObjectSchema = z.strictObject(
    {
      allowMultipleSymbols: z
        .boolean({
          error: (issue) => formFields.presenceIssue(issue.input),
        })
        .exactOptional(),
      category: formFields.requiredText(),
      implicitRoleExtensions: z
        .array(formFields.textValue(), {
          error: (issue) => formFields.nullOrType(issue.input),
        })
        .min(1, {
          error: () => formFields.fixed(EMPTY_LIST),
        })
        .exactOptional(),
      isCategoryNode: z
        .boolean({
          error: (issue) => formFields.presenceIssue(issue.input),
        })
        .exactOptional(),
      name: formFields.requiredText(),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
          });
        }
        if (Array.isArray(issue.input)) {
          return formFields.fixed(INVALID_TYPE);
        }
        return formFields.nullOrType(issue.input);
      },
    }
  );

  const roleGroupSchema = z.array(roleObjectSchema).min(1, {
    error: () => formFields.fixed(EMPTY_LIST),
  });

  const roleItemSchema = z.unknown().superRefine((item, context) => {
    const parsed = Array.isArray(item)
      ? roleGroupSchema.safeParse(item)
      : roleObjectSchema.safeParse(item);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        context.addIssue({ ...issue, path: [...issue.path] });
      }
    }
  });

  return z.array(roleItemSchema, {
    error: (issue) => formFields.nullOrType(issue.input),
  });
})();
