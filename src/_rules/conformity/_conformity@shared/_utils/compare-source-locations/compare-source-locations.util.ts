import type { TSourceLocation } from '../../../../../_src@shared/_utils/create-outcome/index.js';

export function compareSourceLocations(
  left: TSourceLocation,
  right: TSourceLocation
): number {
  return left.line === right.line
    ? left.column - right.column
    : left.line - right.line;
}
