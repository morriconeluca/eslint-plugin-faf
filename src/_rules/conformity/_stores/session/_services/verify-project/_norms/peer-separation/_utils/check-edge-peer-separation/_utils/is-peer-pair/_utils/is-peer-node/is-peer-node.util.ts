import type { TItemClassification } from '../../../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

export function isPeerNode(
  classification: TItemClassification | undefined
): classification is TItemClassification {
  const kind = classification?.nodeKind;
  if (kind === null || kind === undefined) {
    return false;
  }
  const nonPeerNodes = [
    'foreign-node',
    'root-node',
    'unauthorized-logical-node',
  ];
  return !nonPeerNodes.includes(kind);
}
