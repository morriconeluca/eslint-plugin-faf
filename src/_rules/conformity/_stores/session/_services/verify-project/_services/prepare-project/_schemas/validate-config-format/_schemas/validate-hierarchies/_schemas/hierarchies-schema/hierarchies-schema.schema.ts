import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';

export const hierarchiesSchema = (() => {
  const HIERARCHY_ARRAY = 'Hierarchy must be an array.';
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_7 = 'CONFIG_7';
  const EMPTY_LIST = 'configuration/empty-list';
  const EMPTY_TIER = 'configuration/empty-tier';
  const INVALID_PATH = 'configuration/invalid-literal-path';

  const hierarchyItemSchema = formFields.textValue(
    'Hierarchy item cannot be null.',
    'Hierarchy item must be a string.',
    'Hierarchy item cannot be empty.',
    CONFIG_2
  );

  const tierSchema = z
    .array(hierarchyItemSchema, {
      error: (issue) =>
        formFields.nullOrType(
          issue.input,
          'Hierarchy tier cannot be null.',
          'Hierarchy tier must be an array.',
          CONFIG_2
        ),
    })
    .min(1, {
      error: () =>
        formFields.fixed(
          EMPTY_TIER,
          CONFIG_7,
          'Hierarchy tier cannot be empty.'
        ),
    });

  const hierarchySchema = z.array(tierSchema, {
    error: (issue) =>
      formFields.nullOrType(
        issue.input,
        'Hierarchy cannot be null.',
        HIERARCHY_ARRAY,
        CONFIG_2
      ),
  });

  const requiredHierarchySchema = z.array(tierSchema, {
    error: (issue) =>
      issue.input === undefined
        ? formFields.requiredAbsence(
            'hierarchies',
            HIERARCHY_ARRAY,
            CONFIG_2,
            CONFIG_7
          )
        : formFields.nullOrType(
            issue.input,
            'Property "hierarchies" cannot be null.',
            HIERARCHY_ARRAY,
            CONFIG_2
          ),
  });

  const horizontalHierarchiesSchema = z.array(hierarchySchema, {
    error: (issue) =>
      formFields.nullOrType(
        issue.input,
        'Property "horizontalHierarchies" cannot be null.',
        'Property "horizontalHierarchies" must be an array.',
        CONFIG_2
      ),
  });

  const pathItemSchema = formFields
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

  const requiredPaths = z
    .array(pathItemSchema, {
      error: (issue) =>
        issue.input === undefined
          ? formFields.requiredAbsence(
              'paths',
              'Property "paths" must be an array.',
              CONFIG_2,
              CONFIG_7
            )
          : formFields.nullOrType(
              issue.input,
              'Property "paths" cannot be null.',
              'Property "paths" must be an array.',
              CONFIG_2
            ),
    })
    .min(1, {
      error: () =>
        formFields.fixed(
          EMPTY_LIST,
          CONFIG_7,
          'Property "paths" cannot be empty.'
        ),
    });

  const localHierarchySchema = z.strictObject(
    {
      hierarchies: requiredHierarchySchema,
      paths: requiredPaths,
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
            messageStyle: 'plain',
            normativeReference: CONFIG_7,
          });
        }
        return formFields.nullOrType(
          issue.input,
          'Local hierarchy element cannot be null.',
          'Local hierarchy element must be an object.',
          CONFIG_2
        );
      },
    }
  );

  const localHorizontalHierarchiesSchema = z.array(localHierarchySchema, {
    error: (issue) =>
      formFields.nullOrType(
        issue.input,
        'Property "localHorizontalHierarchies" cannot be null.',
        'Property "localHorizontalHierarchies" must be an array.',
        CONFIG_2
      ),
  });

  return {
    horizontal: horizontalHierarchiesSchema,
    local: localHorizontalHierarchiesSchema,
  };
})();
