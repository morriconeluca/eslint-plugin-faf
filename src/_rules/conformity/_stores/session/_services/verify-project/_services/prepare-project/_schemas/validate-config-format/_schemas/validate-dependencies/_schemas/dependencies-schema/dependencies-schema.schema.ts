import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';

export const dependenciesSchema = (() => {
  const ARRAY_MESSAGE = 'Property "{path}" must be an array.';
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_10 = 'CONFIG_10';
  const EMPTY_LIST = 'configuration/empty-list';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_TYPE = 'configuration/invalid-type';
  const NULL_FORBIDDEN = 'configuration/null-forbidden';

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

  const requiredEndpoint = (key: string): z.ZodType<readonly string[]> =>
    z
      .array(pathItem, {
        error: (issue) => {
          if (issue.input === undefined) {
            return formFields.requiredAbsence(
              key,
              ARRAY_MESSAGE,
              CONFIG_2,
              CONFIG_10
            );
          }
          if (issue.input === null) {
            return formFields.fixed(
              NULL_FORBIDDEN,
              CONFIG_2,
              `Property "${key}" cannot be null.`
            );
          }
          return formFields.fixed(INVALID_TYPE, CONFIG_2, ARRAY_MESSAGE);
        },
      })
      .min(1, {
        error: () =>
          formFields.fixed(
            EMPTY_LIST,
            CONFIG_10,
            'Property "{path}" cannot be empty.'
          ),
      });

  const pairSchema = z.strictObject(
    {
      from: requiredEndpoint('from'),
      to: requiredEndpoint('to'),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
            messageStyle: 'plain',
            normativeReference: CONFIG_10,
          });
        }
        return formFields.nullOrType(
          issue.input,
          'Dependency element cannot be null.',
          'Dependency element must be an object.',
          CONFIG_2
        );
      },
    }
  );

  const pairList = z.array(pairSchema, {
    error: () => formFields.fixed(INVALID_TYPE, CONFIG_2, ARRAY_MESSAGE),
  });

  return {
    pairs: pairList,
    publicRootNodes: z.array(pathItem, {
      error: () => formFields.fixed(INVALID_TYPE, CONFIG_2, ARRAY_MESSAGE),
    }),
  };
})();
