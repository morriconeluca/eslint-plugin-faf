import type { TFileClassification } from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  ABSENT_ROLE_KIND,
  NODE_ROOT,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { blankFileFields } from '../../_classify-file@shared/_utils/blank-file-fields/index.js';

export function classifyRootFragmentFile(
  path: string,
  rootNodePaths: ReadonlySet<string>,
  parentFragmentPath: null | string
): TFileClassification {
  const absentRole = { kind: ABSENT_ROLE_KIND, roleName: null } as const;
  if (rootNodePaths.has(path)) {
    return {
      conflict: null,
      fields: blankFileFields(
        NODE_ROOT,
        absentRole,
        null,
        null,
        parentFragmentPath
      ),
    };
  }
  return {
    conflict: 'unenumerated-root-file',
    fields: blankFileFields(null, absentRole, null, null, parentFragmentPath),
  };
}
