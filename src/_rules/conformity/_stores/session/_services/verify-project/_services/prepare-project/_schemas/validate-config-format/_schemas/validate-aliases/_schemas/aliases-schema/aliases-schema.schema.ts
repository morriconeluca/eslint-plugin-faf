import { z } from 'zod';

import { fixedDiagnostic } from '../../../../_validate-config-format@shared/_schemas/fixed-diagnostic/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONFIG_9,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_INVALID_ALIAS_KEY,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_NULL_FORBIDDEN,
} from './aliases-schema.constant.js';

export const aliasesSchema = z
  .record(
    z.string(),
    z
      .string({
        error: (issue) =>
          issue.input === null
            ? fixedDiagnostic(
                CONSTRAINT_NULL_FORBIDDEN,
                CONFIG_2,
                'Alias target cannot be null.'
              )
            : fixedDiagnostic(
                CONSTRAINT_INVALID_TYPE,
                CONFIG_9,
                `Alias target for "${String((issue.path ?? []).at(-1))}" must be a string path.`
              ),
      })
      .min(1, {
        error: () =>
          fixedDiagnostic(
            CONSTRAINT_EMPTY_STRING,
            CONFIG_9,
            'Alias target cannot be empty.'
          ),
      }),
    {
      error: (issue) =>
        issue.input === null
          ? fixedDiagnostic(
              CONSTRAINT_NULL_FORBIDDEN,
              CONFIG_2,
              'Property "aliases" cannot be null.'
            )
          : fixedDiagnostic(
              CONSTRAINT_INVALID_TYPE,
              CONFIG_9,
              'Property "aliases" must be a map of string prefixes to path strings.'
            ),
    }
  )
  .superRefine((aliases, context) => {
    for (const [key, value] of Object.entries(aliases)) {
      if (key.length === 0) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(
            CONSTRAINT_EMPTY_STRING,
            CONFIG_9,
            'Alias key cannot be empty.'
          ),
          path: [],
        });
      }
      if (key.endsWith('/')) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(
            CONSTRAINT_INVALID_ALIAS_KEY,
            CONFIG_9,
            `Alias key "${key}" cannot have a trailing slash.`
          ),
          path: [key],
        });
      }
      if (key.includes('*')) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(
            CONSTRAINT_INVALID_ALIAS_KEY,
            CONFIG_9,
            `Alias key "${key}" cannot contain wildcard characters.`
          ),
          path: [key],
        });
      }
      if (value.length > 0 && !isLiteralConfigPath(value)) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(
            CONSTRAINT_INVALID_LITERAL_PATH,
            CONFIG_2_2,
            `Invalid literal config path "${value}".`
          ),
          path: [key],
        });
      }
    }
  });
