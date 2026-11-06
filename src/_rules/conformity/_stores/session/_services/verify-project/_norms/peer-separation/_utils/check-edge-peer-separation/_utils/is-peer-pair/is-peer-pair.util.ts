import type { TTaxonomyModel } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { isPeerDomain } from './_utils/is-peer-domain/index.js';
import { isPeerNode } from './_utils/is-peer-node/index.js';

export function isPeerPair(
  sourceStepId: number,
  destinationStepId: number,
  taxonomy: TTaxonomyModel
): boolean {
  const sourceClassification = taxonomy.byItemId.get(sourceStepId);
  const destinationClassification = taxonomy.byItemId.get(destinationStepId);

  const areBothDomains =
    isPeerDomain(sourceClassification) &&
    isPeerDomain(destinationClassification) &&
    destinationClassification.domainKind !== 'fractal-branch';

  const areBothNodes =
    isPeerNode(sourceClassification) && isPeerNode(destinationClassification);

  return areBothDomains || areBothNodes;
}
