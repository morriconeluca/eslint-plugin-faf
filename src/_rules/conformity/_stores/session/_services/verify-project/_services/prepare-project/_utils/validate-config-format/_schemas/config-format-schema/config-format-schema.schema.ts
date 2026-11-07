import { formFields } from '../../_validate-config-format@shared/_schemas/form-fields/index.js';
import { configShape } from './_schemas/config-shape/index.js';

export const configFormatSchema = configShape.root.refine(
  (value) => value.faf.locals.length > 0,
  {
    message: formFields.fixed('configuration/empty-list'),
    path: ['faf', 'locals'],
  }
);
