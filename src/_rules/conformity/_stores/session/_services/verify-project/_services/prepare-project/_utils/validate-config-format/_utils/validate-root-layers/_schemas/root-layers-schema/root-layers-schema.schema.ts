import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';
import {
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_NULL_FORBIDDEN,
} from './root-layers-schema.constant.js';

export const rootLayersSchema = z.array(
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
    })
    .superRefine((item, context) => {
      if (item.length > 0 && !formFields.isLiteralPath(item)) {
        context.addIssue({
          code: 'custom',
          message: formFields.fixed(CONSTRAINT_INVALID_LITERAL_PATH),
        });
      }
    }),
  {
    error: (issue) =>
      formFields.fixed(
        issue.input === null
          ? CONSTRAINT_NULL_FORBIDDEN
          : CONSTRAINT_INVALID_TYPE
      ),
  }
);
