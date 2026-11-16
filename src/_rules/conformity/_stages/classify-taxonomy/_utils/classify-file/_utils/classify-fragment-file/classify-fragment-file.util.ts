import type {
  TDirectoryParent,
  TFileClassification,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  ABSENT_ROLE_KIND,
  ACCESS_NODE_FILE_NAME,
  DOT_PATH,
  NODE_ACCESS,
  NODE_FRAGMENT,
  NODE_SUB_GRAPH,
  NODE_UNAUTHORIZED,
  ROLE_EXPLICIT,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { blankFileFields } from '../../_classify-file@shared/_utils/blank-file-fields/index.js';

export function classifyFragmentFile(
  fileName: string,
  parent: TDirectoryParent,
  context: TTreeClassificationContext,
  parentFragmentPath: null | string
): TFileClassification {
  const role = context.getRoleFromName(fileName, context.catalog);
  const dotIndex = fileName.indexOf(DOT_PATH);
  const stem = dotIndex <= 0 ? fileName : fileName.slice(0, dotIndex);
  const isNameMatches = stem === readPathName(parent.path);
  if (fileName === ACCESS_NODE_FILE_NAME && role.kind === ABSENT_ROLE_KIND) {
    return {
      conflict: null,
      fields: blankFileFields(
        NODE_ACCESS,
        { kind: ABSENT_ROLE_KIND, roleName: null },
        parent.imposedRoleName,
        context.catalog.topRank,
        parentFragmentPath
      ),
    };
  }
  if (isNameMatches && role.kind === ROLE_EXPLICIT) {
    const isSubGraph = context.catalog.subGraphRoles.some(
      (name) => name === role.roleName
    );
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
    const matchedRole = context.catalog.roles.find(
      (candidate) => candidate.name === role.roleName
    );
    return {
      conflict: null,
      fields: blankFileFields(
        NODE_FRAGMENT,
        role,
        parent.imposedRoleName,
        matchedRole === undefined ? null : matchedRole.rank,
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
