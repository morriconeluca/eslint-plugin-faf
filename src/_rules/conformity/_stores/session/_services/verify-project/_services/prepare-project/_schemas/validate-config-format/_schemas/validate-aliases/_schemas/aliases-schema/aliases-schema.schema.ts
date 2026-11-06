import { z } from 'zod';

import { fixedDiagnostic } from '../../../../_validate-config-format@shared/_schemas/fixed-diagnostic/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';
import {
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
          fixedDiagnostic(
            issue.input === null
              ? CONSTRAINT_NULL_FORBIDDEN
              : CONSTRAINT_INVALID_TYPE
          ),
      })
      .min(1, {
        error: () => fixedDiagnostic(CONSTRAINT_EMPTY_STRING),
      }),
    {
      error: (issue) =>
        fixedDiagnostic(
          issue.input === null
            ? CONSTRAINT_NULL_FORBIDDEN
            : CONSTRAINT_INVALID_TYPE
        ),
    }
  )
  .superRefine((aliases, context) => {
    for (const [key, value] of Object.entries(aliases)) {
      if (key.length === 0) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(CONSTRAINT_EMPTY_STRING),
          path: [],
        });
      }
      if (key.endsWith('/')) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(CONSTRAINT_INVALID_ALIAS_KEY),
          path: [key],
        });
      }
      if (key.includes('*')) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(CONSTRAINT_INVALID_ALIAS_KEY),
          path: [key],
        });
      }
      if (value.length > 0 && !isLiteralConfigPath(value)) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(CONSTRAINT_INVALID_LITERAL_PATH),
          path: [key],
        });
      }
    }
  });
