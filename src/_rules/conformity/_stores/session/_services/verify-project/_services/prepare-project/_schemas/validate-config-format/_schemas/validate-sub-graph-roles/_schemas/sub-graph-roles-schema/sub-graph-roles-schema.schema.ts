import { z } from 'zod';

import { formFields } from '../../../../_validate-config-format@shared/_schemas/form-fields/index.js';

export const subGraphRolesSchema = (() => {
  const CONFIG_2 = 'CONFIG_2';
  const CONFIG_3 = 'CONFIG_3';

  const subGraphRoleSchema = z.strictObject(
    {
      name: formFields.requiredText('name', CONFIG_2, CONFIG_3),
    },
    {
      error: (issue) => {
        if (issue.code === 'unrecognized_keys') {
          return formFields.encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
            messageStyle: 'sub-graph',
            normativeReference: CONFIG_3,
          });
        }
        return formFields.nullOrType(
          issue.input,
          'Sub-graph role cannot be null.',
          'Sub-graph role must be an object.',
          CONFIG_2
        );
      },
    }
  );

  return z.array(subGraphRoleSchema, {
    error: (issue) =>
      formFields.nullOrType(
        issue.input,
        'Property "subGraphRoles" cannot be null.',
        'Property "subGraphRoles" must be an array.',
        CONFIG_2
      ),
  });
})();
