import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const rolesSchema = (() => {
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_3 = 'CONFIG_3';
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_TYPE = 'configuration/invalid-type';

  const roleObjectSchema = z.strictObject(
    {
      allowMultipleSymbols: z
        .boolean({
          error: (issue) =>
            formFields.presenceIssue(
              issue.input,
              'allowMultipleSymbols',
              'Property "allowMultipleSymbols" must be a boolean.',
              CONFIG_2
            ),
        })
        .exactOptional(),
      category: formFields.requiredText('category', CONFIG_2, CONFIG_3),
      implicitRoleExtensions: z
        .array(
          formFields.textValue(
            'Implicit extension cannot be null.',
            'Implicit extension must be a string.',
            'Implicit extension cannot be empty.',
            CONFIG_2
          ),
          {
            error: (issue) =>
              formFields.nullOrType(
                issue.input,
                'Property "implicitRoleExtensions" cannot be null.',
                'Property "implicitRoleExtensions" must be an array.',
                CONFIG_2
              ),
          }
        )
        .min(1, {
          error: () =>
            formFields.fixed(
              EMPTY_LIST,
              CONFIG_3,
              'Property "implicitRoleExtensions" cannot be empty.'
            ),
        })
        .exactOptional(),
      isCategoryNode: z
        .boolean({
          error: (issue) =>
            formFields.presenceIssue(
              issue.input,
              'isCategoryNode',
              'Property "isCategoryNode" must be a boolean.',
              CONFIG_2
            ),
        })
        .exactOptional(),
      name: formFields.requiredText('name', CONFIG_2, CONFIG_3),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
            messageStyle: 'plain',
            normativeReference: CONFIG_3,
          });
        }
        if (Array.isArray(issue.input)) {
          return formFields.fixed(
            INVALID_TYPE,
            CONFIG_3,
            'Further nesting of role groups is forbidden.'
          );
        }
        return formFields.nullOrType(
          issue.input,
          'Role element cannot be null.',
          'Role element must be an object.',
          CONFIG_2
        );
      },
    }
  );

  const roleGroupSchema = z.array(roleObjectSchema).min(1, {
    error: () =>
      formFields.fixed(EMPTY_LIST, CONFIG_3, 'Role group cannot be empty.'),
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
    error: (issue) =>
      formFields.nullOrType(
        issue.input,
        'Property "roles" cannot be null.',
        'Property "roles" must be an array.',
        CONFIG_2
      ),
  });
})();
