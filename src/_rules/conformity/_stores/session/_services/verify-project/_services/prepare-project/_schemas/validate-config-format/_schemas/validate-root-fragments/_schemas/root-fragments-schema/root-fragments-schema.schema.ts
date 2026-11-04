import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';

export const rootFragmentsSchema = (() => {
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_4 = 'CONFIG_4';
  const EMPTY_LIST = 'configuration/empty-list';
  const EMPTY_TIER = 'configuration/empty-tier';
  const INVALID_FILE = 'configuration/invalid-file-name';
  const INVALID_PATH = 'configuration/invalid-literal-path';
  const INVALID_TYPE = 'configuration/invalid-type';
  const NULL_FORBIDDEN = 'configuration/null-forbidden';

  const fileName = (
    nullMessage: string,
    typeMessage: string,
    emptyMessage: string,
    invalidMessage: (value: string) => string
  ): z.ZodType<string> =>
    formFields
      .textValue(nullMessage, typeMessage, emptyMessage, CONFIG_2)
      .superRefine((value, context) => {
        if (value.includes('/') || !isLiteralConfigPath(value)) {
          context.addIssue({
            code: 'custom',
            message: formFields.fixed(
              INVALID_FILE,
              CONFIG_4,
              invalidMessage(value)
            ),
          });
        }
      });

  const literalPath = formFields
    .textValue(
      'Edge target cannot be null.',
      'Edge target must be a string.',
      'Edge target cannot be empty.',
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

  const nonEmptyNames = (
    key: string,
    item: z.ZodType<string>
  ): z.ZodType<readonly string[]> =>
    z
      .array(item, {
        error: (issue) => {
          if (issue.input === undefined) {
            return formFields.requiredAbsence(
              key,
              'Property "{path}" must be an array.',
              CONFIG_2,
              CONFIG_4
            );
          }
          if (issue.input === null) {
            return formFields.fixed(
              NULL_FORBIDDEN,
              CONFIG_2,
              `Property "${key}" cannot be null.`
            );
          }
          return formFields.fixed(
            INVALID_TYPE,
            CONFIG_2,
            'Property "{path}" must be an array.'
          );
        },
      })
      .min(1, {
        error: () =>
          formFields.fixed(
            EMPTY_LIST,
            CONFIG_4,
            'Property "{path}" cannot be empty.'
          ),
      });

  const edgeSchema = z.strictObject(
    {
      from: nonEmptyNames(
        'from',
        fileName(
          'Edge target cannot be null.',
          'Edge target must be a string.',
          'Edge target cannot be empty.',
          (value) => `File name "${value}" cannot contain "/".`
        )
      ),
      to: nonEmptyNames('to', literalPath),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
            messageStyle: 'plain',
            normativeReference: CONFIG_2,
          });
        }
        return formFields.nullOrType(
          issue.input,
          'Dependency edge cannot be null.',
          'Dependency edge must be an object.',
          CONFIG_2
        );
      },
    }
  );

  const tierSchema = z
    .array(
      fileName(
        'Root node element cannot be null.',
        'Root node element must be a string.',
        'Root node element cannot be empty.',
        (value) =>
          `Root node file name "${value}" must be a direct child without "/".`
      ),
      {
        error: (issue) =>
          formFields.nullOrType(
            issue.input,
            'Root nodes tier cannot be null.',
            'Root nodes tier must be an array.',
            CONFIG_2
          ),
      }
    )
    .min(1, {
      error: () =>
        formFields.fixed(
          EMPTY_TIER,
          CONFIG_4,
          'Root nodes tier cannot be empty.'
        ),
    });

  const fragmentShape = {
    dependencyEdges: z
      .array(edgeSchema, {
        error: (issue) =>
          formFields.presenceIssue(
            issue.input,
            'dependencyEdges',
            'Property "dependencyEdges" must be an array.',
            CONFIG_2
          ),
      })
      .exactOptional(),
    path: formFields
      .requiredText('path', CONFIG_2, CONFIG_2)
      .superRefine((value, context) => {
        if (value.length > 0 && !isLiteralConfigPath(value)) {
          context.addIssue({
            code: 'custom',
            message: formFields.fixed(
              INVALID_PATH,
              'CONFIG_2_2',
              `Invalid literal config path "${value}".`
            ),
          });
        }
      }),
    rootNodes: z.array(tierSchema, {
      error: (issue) =>
        issue.input === undefined
          ? formFields.requiredAbsence(
              'rootNodes',
              'Property "rootNodes" must be an array.',
              CONFIG_2,
              CONFIG_2
            )
          : formFields.nullOrType(
              issue.input,
              'Property "rootNodes" cannot be null.',
              'Property "rootNodes" must be an array.',
              CONFIG_2
            ),
    }),
  };

  const rootFragmentSchema: z.ZodType = z.lazy(() =>
    z.strictObject(
      {
        ...fragmentShape,
        subRootFragments: z.array(rootFragmentSchema).exactOptional(),
      },
      {
        error: (issue) => {
          if (issue.code === 'unrecognized_keys') {
            return formFields.encode({
              constraint: 'configuration/unknown-property',
              kind: 'keys',
              messageStyle: 'plain',
              normativeReference: CONFIG_2,
            });
          }
          return formFields.nullOrType(
            issue.input,
            'Root fragment element cannot be null.',
            'Root fragment element must be an object.',
            CONFIG_2
          );
        },
      }
    )
  );

  return z.array(rootFragmentSchema, {
    error: (issue) =>
      formFields.nullOrType(
        issue.input,
        'Property "rootFragments" cannot be null.',
        'Property "rootFragments" must be an array.',
        CONFIG_2
      ),
  });
})();
