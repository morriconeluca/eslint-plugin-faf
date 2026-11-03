import { SLASH } from '../../_constants/classification-constraints.constant.js';

export function readPathName(path: string): string {
  return path.slice(path.lastIndexOf(SLASH) + 1);
}
