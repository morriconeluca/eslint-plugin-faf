import type {
  TFileClassification,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  ABSENT_ROLE,
  NODE_FOREIGN,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { blankFileFields } from '../../../../_classify-taxonomy@shared/_utils/blank-file-fields/index.js';

export function classifyDesignatedFile(
  path: string,
  context: TTreeClassificationContext,
  parentFragmentPath: null | string
): null | TFileClassification {
  const isDesignatedForeign = context.foreignNodePaths.has(path);
  const isDesignatedRoot = context.rootNodePaths.has(path);
  if (isDesignatedRoot && isDesignatedForeign) {
    return {
      conflict: 'contradictory-root-foreign',
      fields: blankFileFields(
        null,
        ABSENT_ROLE,
        null,
        null,
        parentFragmentPath
      ),
    };
  }
  if (!isDesignatedForeign) {
    return null;
  }
  return {
    conflict: null,
    fields: blankFileFields(
      NODE_FOREIGN,
      ABSENT_ROLE,
      null,
      null,
      parentFragmentPath
    ),
  };
}
