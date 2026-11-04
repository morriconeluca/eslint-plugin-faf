import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';

export const mimeticStructuresSchema = (() => {
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_8 = 'CONFIG_8';
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_PATH = 'configuration/invalid-literal-path';

  const pathItem = formFields
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

  const actionItem = formFields.textValue(
    'Action element cannot be null.',
    'Action element must be a string.',
    'Action element cannot be empty.',
    CONFIG_2
  );

  const structureSchema = z.strictObject(
    {
      actions: z
        .array(actionItem, {
          error: (issue) =>
            formFields.presenceIssue(
              issue.input,
              'actions',
              'Property "actions" must be an array.',
              CONFIG_2
            ),
        })
        .min(1, {
          error: () =>
            formFields.fixed(
              EMPTY_LIST,
              CONFIG_8,
              'Property "actions" cannot be empty when present.'
            ),
        })
        .exactOptional(),
      paths: z
        .array(pathItem, {
          error: (issue) =>
            issue.input === undefined
              ? formFields.requiredAbsence(
                  'paths',
                  'Property "paths" must be an array.',
                  CONFIG_2,
                  CONFIG_8
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
              CONFIG_8,
              'Property "paths" cannot be empty.'
            ),
        }),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
            messageStyle: 'plain',
            normativeReference: CONFIG_8,
          });
        }
        return formFields.nullOrType(
          issue.input,
          'Mimetic path structure element cannot be null.',
          'Mimetic path structure element must be an object.',
          CONFIG_2
        );
      },
    }
  );

  return z.array(structureSchema, {
    error: (issue) =>
      formFields.nullOrType(
        issue.input,
        'Property "mimeticPathStructures" cannot be null.',
        'Property "mimeticPathStructures" must be an array.',
        CONFIG_2
      ),
  });
})();
