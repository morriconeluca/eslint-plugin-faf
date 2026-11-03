import type { TFAFForeignNodeFamily } from '../../../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectForeignDomain } from './_utils/reject-foreign-domain/index.js';
import { rejectForeignNodeEntry } from './_utils/reject-foreign-node-entry/index.js';

export function validateForeignSection(
  domains: readonly string[] | undefined,
  nodes: readonly (string | TFAFForeignNodeFamily)[] | undefined,
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const domainOutcomes = (domains ?? []).flatMap((path, index) =>
    rejectForeignDomain(
      path,
      `${basePath}.foreignDomains[${index}]`,
      scope,
      context
    )
  );
  const nodeOutcomes = (nodes ?? []).flatMap((entry, index) =>
    rejectForeignNodeEntry(
      entry,
      `${basePath}.foreignNodes[${index}]`,
      scope,
      context
    )
  );
  return [...domainOutcomes, ...nodeOutcomes];
}
