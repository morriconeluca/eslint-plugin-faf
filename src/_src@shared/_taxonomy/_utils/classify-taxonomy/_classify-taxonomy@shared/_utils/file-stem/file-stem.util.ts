import { DOT_PATH } from '../../_constants/classification-constraints.constant.js';

export function fileStem(fileName: string): string {
  const dotIndex = fileName.indexOf(DOT_PATH);
  return dotIndex <= 0 ? fileName : fileName.slice(0, dotIndex);
}
