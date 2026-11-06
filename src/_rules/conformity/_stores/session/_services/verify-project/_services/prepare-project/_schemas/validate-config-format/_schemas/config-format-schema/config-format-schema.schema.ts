import type { z } from 'zod';

import type { TFAFConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';

import { formFields } from '../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { configShape } from './_schemas/config-shape/index.js';

export const configFormatSchema: z.ZodType<TFAFConfig> =
  configShape.root.refine(
    (value): value is TFAFConfig => value.faf.locals.length > 0,
    {
      message: formFields.fixed('configuration/empty-list'),
      path: ['faf', 'locals'],
    }
  );
