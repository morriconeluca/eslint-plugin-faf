import type { TConfigOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { translateConfigIssues } from '../../_validate-config-format@shared/_utils/config-diagnostic-codec/index.js';
import { aliasesSchema } from './validate-aliases.schema.js';

export function validateAliases(
  aliases: unknown,
  basePath: string
): readonly TConfigOutcome[] {
  const parsed = aliasesSchema.safeParse(aliases);
  return parsed.success
    ? []
    : translateConfigIssues(
        parsed.error.issues,
        aliases,
        `${basePath}.aliases`
      );
}
