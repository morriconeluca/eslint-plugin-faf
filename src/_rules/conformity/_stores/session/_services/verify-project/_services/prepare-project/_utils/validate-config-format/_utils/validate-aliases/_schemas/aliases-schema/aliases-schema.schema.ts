import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
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
          formFields.fixed(
            issue.input === null
              ? CONSTRAINT_NULL_FORBIDDEN
              : CONSTRAINT_INVALID_TYPE
          ),
      })
      .min(1, {
        error: () => formFields.fixed(CONSTRAINT_EMPTY_STRING),
      }),
    {
      error: (issue) =>
        formFields.fixed(
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
          message: formFields.fixed(CONSTRAINT_EMPTY_STRING),
          path: [],
        });
      }
      if (key.endsWith('/')) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(CONSTRAINT_INVALID_ALIAS_KEY),
          path: [key],
        });
      }
      if (key.includes('*')) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(CONSTRAINT_INVALID_ALIAS_KEY),
          path: [key],
        });
      }
      if (
        value.includes('*') ||
        (value.length > 0 && !formFields.isLiteralPath(value))
      ) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(CONSTRAINT_INVALID_LITERAL_PATH),
          path: [key],
        });
      }
    }
  });
