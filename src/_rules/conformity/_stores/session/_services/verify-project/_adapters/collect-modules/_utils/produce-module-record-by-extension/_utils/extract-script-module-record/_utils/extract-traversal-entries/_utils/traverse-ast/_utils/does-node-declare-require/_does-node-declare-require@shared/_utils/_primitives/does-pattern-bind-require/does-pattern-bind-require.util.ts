import type { BindingPattern, BindingRestElement } from 'oxc-parser';

import { REQUIRE_NAME } from '../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';

export function doesPatternBindRequire(
  pattern: BindingPattern | BindingRestElement
): boolean {
  let current: BindingPattern | BindingRestElement = pattern;
  while (
    current.type === 'AssignmentPattern' ||
    current.type === 'RestElement'
  ) {
    current =
      current.type === 'AssignmentPattern' ? current.left : current.argument;
  }

  if (current.type === 'Identifier') {
    return current.name === REQUIRE_NAME;
  }

  if (current.type === 'ArrayPattern') {
    return current.elements.some(
      (element) => element !== null && doesPatternBindRequire(element)
    );
  }

  return current.properties.some((property) => {
    const next =
      property.type === 'Property' ? property.value : property.argument;
    return doesPatternBindRequire(next);
  });
}
