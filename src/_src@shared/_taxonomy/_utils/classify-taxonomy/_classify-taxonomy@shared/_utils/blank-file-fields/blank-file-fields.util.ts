import type {
  TNodeKind,
  TRoleAttribution,
} from '../../../../../_types/classification.type.js';
import type { TFileClassification } from '../../_types/classify-taxonomy.type.js';

export function blankFileFields(
  nodeKind: null | TNodeKind,
  role: TRoleAttribution,
  imposedRoleName: null | string,
  fragmentInternalRank: null | number,
  parentFragmentPath: null | string
): TFileClassification['fields'] {
  return {
    domainKind: null,
    form: null,
    fragmentInternalRank,
    imposedRoleName,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    nodeKind,
    parentFragmentPath,
    role,
  };
}
