import type {
  TItemClassification,
  TNodeKind,
} from '../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TDirectChildType,
  TParentDomainType,
} from './containment-matrix.type.js';

const resolveFileChild = (
  nodeKind: null | TNodeKind,
  parentType: TParentDomainType
): null | TDirectChildType => {
  const fragmentNodeType = 'fragment-node';
  if (nodeKind === fragmentNodeType || nodeKind === 'master-node') {
    return fragmentNodeType;
  }
  if (nodeKind === 'unauthorized-logical-node') {
    if (parentType === 'fragment') {
      return fragmentNodeType;
    }
    return parentType === 'category'
      ? 'category-node'
      : 'unauthorized-logical-node';
  }
  return nodeKind;
};

export function resolveChildType(
  child: TItemClassification,
  parentType: TParentDomainType
): null | TDirectChildType {
  if (child.entryKind === 'file') {
    return resolveFileChild(child.nodeKind, parentType);
  }

  const { domainKind } = child;
  if (domainKind === 'category') {
    return child.relationalQualifications.isPrivateCategory
      ? 'private-category'
      : 'category';
  }
  return domainKind;
}
