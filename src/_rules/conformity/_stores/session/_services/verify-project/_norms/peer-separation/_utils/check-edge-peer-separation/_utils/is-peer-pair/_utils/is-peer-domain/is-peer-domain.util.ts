import type { TItemClassification } from '../../../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

export function isPeerDomain(
  classification: TItemClassification | undefined
): classification is TItemClassification {
  const kind = classification?.domainKind;
  if (kind === null || kind === undefined) {
    return false;
  }
  const nonPeerDomains = ['foreign-domain', 'root-fragment'];
  return !nonPeerDomains.includes(kind);
}
