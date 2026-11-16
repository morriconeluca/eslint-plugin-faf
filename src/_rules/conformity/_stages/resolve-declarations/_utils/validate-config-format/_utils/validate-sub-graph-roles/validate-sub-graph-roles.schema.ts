import { z } from 'zod';

import { formFields } from '../../_validate-config-format@shared/_utils/config-diagnostic-codec/index.js';

const subGraphRoleSchema = z.strictObject(
  {
    name: formFields.requiredText(),
  },
  {
    error: (issue) =>
      issue.code === 'unrecognized_keys'
        ? formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
          })
        : formFields.nullOrType(issue.input),
  }
);

export const subGraphRolesSchema = z.array(subGraphRoleSchema, {
  error: (issue) => formFields.nullOrType(issue.input),
});
