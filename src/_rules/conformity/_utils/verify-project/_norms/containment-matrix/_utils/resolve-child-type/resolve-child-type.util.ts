import type {
  TItemClassification,
  TNodeKind,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TResolvedChildType,
  TResolvedParentType,
} from './resolve-child-type.type.js';

export function resolveChildType(
  child: TItemClassification,
  parentType: TResolvedParentType
): null | TResolvedChildType {
  const resolveFileChild = (
    nodeKind: null | TNodeKind
  ): null | TResolvedChildType => {
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
