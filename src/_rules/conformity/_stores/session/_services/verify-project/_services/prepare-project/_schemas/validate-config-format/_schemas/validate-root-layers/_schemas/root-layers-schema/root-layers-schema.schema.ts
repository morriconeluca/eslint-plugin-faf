import { z } from 'zod';

import { fixedDiagnostic } from '../../../../_validate-config-format@shared/_schemas/fixed-diagnostic/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_NULL_FORBIDDEN,
} from './root-layers-schema.constant.js';

export const rootLayersSchema = z.array(
  z
    .string({
      error: (issue) =>
        issue.input === null
          ? fixedDiagnostic(
              CONSTRAINT_NULL_FORBIDDEN,
              CONFIG_2,
              'Root layer element cannot be null.'
            )
          : fixedDiagnostic(
              CONSTRAINT_INVALID_TYPE,
              CONFIG_2,
              'Root layer element must be a string.'
            ),
    })
    .min(1, {
      error: () =>
        fixedDiagnostic(
          CONSTRAINT_EMPTY_STRING,
          CONFIG_2,
          'Root layer element cannot be empty.'
        ),
    })
    .superRefine((item, context) => {
      if (item.length > 0 && !isLiteralConfigPath(item)) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(
            CONSTRAINT_INVALID_LITERAL_PATH,
            CONFIG_2_2,
            `Invalid literal config path "${item}".`
          ),
        });
      }
    }),
  {
    error: (issue) =>
      issue.input === null
        ? fixedDiagnostic(
            CONSTRAINT_NULL_FORBIDDEN,
            CONFIG_2,
            'Property "rootLayers" cannot be null.'
          )
        : fixedDiagnostic(
            CONSTRAINT_INVALID_TYPE,
            CONFIG_2,
            'Property "rootLayers" must be an array.'
          ),
  }
);
