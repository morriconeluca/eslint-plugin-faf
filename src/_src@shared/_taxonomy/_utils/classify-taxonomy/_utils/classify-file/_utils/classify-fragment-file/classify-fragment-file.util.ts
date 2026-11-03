import type {
  TDirectoryParent,
  TFileClassification,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  ABSENT_ROLE,
  ABSENT_ROLE_KIND,
  ACCESS_NODE_FILE_NAME,
  NODE_ACCESS,
  NODE_FRAGMENT,
  NODE_SUB_GRAPH,
  NODE_UNAUTHORIZED,
  ROLE_EXPLICIT,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { blankFileFields } from '../../../../_classify-taxonomy@shared/_utils/blank-file-fields/index.js';
import { fileStem } from '../../../../_classify-taxonomy@shared/_utils/file-stem/index.js';
import { readPathName } from '../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';

export function classifyFragmentFile(
  fileName: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext,
  parentFragmentPath: null | string
): TFileClassification {
  const role = context.getRoleFromName(fileName, context.catalog);
  const isNameMatches = fileStem(fileName) === readPathName(parent.path);
  if (fileName === ACCESS_NODE_FILE_NAME && role.kind === ABSENT_ROLE_KIND) {
    return {
      conflict: null,
      fields: blankFileFields(
        NODE_ACCESS,
        ABSENT_ROLE,
        parent.imposedRoleName,
        context.catalog.topRank,
        parentFragmentPath
      ),
    };
  }
  const isSubGraph =
    isNameMatches &&
    role.kind === ROLE_EXPLICIT &&
    context.catalog.subGraphRoles.some((name) => name === role.roleName);
  if (isSubGraph) {
    return {
      conflict: null,
      fields: blankFileFields(
        NODE_SUB_GRAPH,
        role,
        parent.imposedRoleName,
        context.catalog.topRank,
        parentFragmentPath
      ),
    };
  }
  if (isNameMatches && role.kind === ROLE_EXPLICIT) {
    let rank: null | number = null;
    for (const candidate of context.catalog.roles) {
      if (candidate.name === role.roleName) {
        rank = candidate.rank;
      }
    }
    return {
      conflict: null,
      fields: blankFileFields(
        NODE_FRAGMENT,
        role,
        parent.imposedRoleName,
        rank,
        parentFragmentPath
      ),
    };
  }
  return {
    conflict: null,
    fields: blankFileFields(
      NODE_UNAUTHORIZED,
      role,
      parent.imposedRoleName,
      null,
      parentFragmentPath
    ),
  };
}
