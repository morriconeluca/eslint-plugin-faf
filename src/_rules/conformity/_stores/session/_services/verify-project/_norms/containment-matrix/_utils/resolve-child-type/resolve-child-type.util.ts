import type {
  TItemClassification,
  TNodeKind,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDirectChildType,
  TParentDomainType,
} from '../../_containment-matrix@shared/_types/containment-matrix.type.js';

export function resolveChildType(
  child: TItemClassification,
  parentType: TParentDomainType
): null | TDirectChildType {
  const resolveFileChild = (
    nodeKind: null | TNodeKind
  ): null | TDirectChildType => {
    const FRAGMENT_NODE = 'fragment-node';
    if (nodeKind === FRAGMENT_NODE || nodeKind === 'master-node') {
      return FRAGMENT_NODE;
    }
    if (nodeKind === 'unauthorized-logical-node') {
      if (parentType === 'fragment') {
        return FRAGMENT_NODE;
      }
      return parentType === 'category'
        ? 'category-node'
        : 'unauthorized-logical-node';
    }
    return nodeKind;
  };

  if (child.entryKind === 'file') {
    return resolveFileChild(child.nodeKind);
  }

  const { domainKind } = child;
  if (domainKind === 'category') {
    return child.relationalQualifications.isPrivateCategory
      ? 'private-category'
      : 'category';
  }
  return domainKind;
}
