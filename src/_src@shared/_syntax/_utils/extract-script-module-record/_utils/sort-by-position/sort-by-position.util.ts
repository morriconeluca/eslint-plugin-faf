import type { TSourceLocation } from '../../../../../_domain/_types/outcome.type.js';

export function sortByPosition<
  T extends { readonly position: TSourceLocation },
>(items: readonly T[]): readonly T[] {
  const elements = [...items];
  elements.sort((first, second) =>
    first.position.line === second.position.line
      ? first.position.column - second.position.column
      : first.position.line - second.position.line
  );
  return elements;
}
