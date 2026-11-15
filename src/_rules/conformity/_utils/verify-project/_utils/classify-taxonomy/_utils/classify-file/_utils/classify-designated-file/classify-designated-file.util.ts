import type {
  TFileClassification,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  ABSENT_ROLE_KIND,
  NODE_FOREIGN,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { blankFileFields } from '../../_classify-file@shared/_utils/blank-file-fields/index.js';

export function classifyDesignatedFile(
  path: string,
  context: TTreeClassificationContext,
  parentFragmentPath: null | string
): null | TFileClassification {
  const absentRole = { kind: ABSENT_ROLE_KIND, roleName: null } as const;
  const isDesignatedForeign = context.foreignNodePaths.has(path);
  const isDesignatedRoot = context.rootNodePaths.has(path);
  if (isDesignatedRoot && isDesignatedForeign) {
    return {
      conflict: 'contradictory-root-foreign',
      fields: blankFileFields(null, absentRole, null, null, parentFragmentPath),
    };
  }
  if (!isDesignatedForeign) {
    return null;
  }
  return {
    conflict: null,
    fields: blankFileFields(
      NODE_FOREIGN,
      absentRole,
      null,
      null,
      parentFragmentPath
    ),
  };
}
