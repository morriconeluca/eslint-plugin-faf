import { z } from 'zod';

import { fixedDiagnostic } from '../../../../_validate-config-format@shared/_schemas/fixed-diagnostic/index.js';
import { isLiteralConfigPath } from '../../../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';
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
        fixedDiagnostic(
          issue.input === null
            ? CONSTRAINT_NULL_FORBIDDEN
            : CONSTRAINT_INVALID_TYPE
        ),
    })
    .min(1, {
      error: () => fixedDiagnostic(CONSTRAINT_EMPTY_STRING),
    })
    .superRefine((item, context) => {
      if (item.length > 0 && !isLiteralConfigPath(item)) {
        context.addIssue({
          code: 'custom',
          message: fixedDiagnostic(CONSTRAINT_INVALID_LITERAL_PATH),
        });
      }
    }),
  {
    error: (issue) =>
      fixedDiagnostic(
        issue.input === null
          ? CONSTRAINT_NULL_FORBIDDEN
          : CONSTRAINT_INVALID_TYPE
      ),
  }
);
