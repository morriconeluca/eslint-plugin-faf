import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { translateConfigIssues } from '../../_validate-config-format@shared/_schemas/translate-config-issues/index.js';
import { aliasesSchema } from './_schemas/aliases-schema/index.js';

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
