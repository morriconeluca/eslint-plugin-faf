import {
  DOT_PATH,
  SLASH,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function joinPosixPath(parentPath: string, name: string): string {
  return parentPath === DOT_PATH ? name : `${parentPath}${SLASH}${name}`;
}
