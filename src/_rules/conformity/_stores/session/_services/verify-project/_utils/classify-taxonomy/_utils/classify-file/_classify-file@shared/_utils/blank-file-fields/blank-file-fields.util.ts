import type {
  TNodeKind,
  TRoleAttribution,
} from '../../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TFileClassification } from '../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

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
