import type { TSourceLocation } from '../../_types/outcome.type.js';

export function compareSourceLocations(
  left: TSourceLocation,
  right: TSourceLocation
): number {
  return left.line === right.line
    ? left.column - right.column
    : left.line - right.line;
}
