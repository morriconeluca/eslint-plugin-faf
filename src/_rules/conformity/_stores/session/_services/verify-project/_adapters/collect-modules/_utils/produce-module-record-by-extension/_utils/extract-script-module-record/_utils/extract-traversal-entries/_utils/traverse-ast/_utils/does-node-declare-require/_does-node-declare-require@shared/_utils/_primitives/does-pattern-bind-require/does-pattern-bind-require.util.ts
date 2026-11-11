import type { BindingPattern, BindingRestElement } from 'oxc-parser';

import { REQUIRE_NAME } from '../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';

export function doesPatternBindRequire(
  pattern: BindingPattern | BindingRestElement,
  name: string = REQUIRE_NAME
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
    return current.name === name;
  }

  if (current.type === 'ArrayPattern') {
    return current.elements.some(
      (element) => element !== null && doesPatternBindRequire(element, name)
    );
  }

  return current.properties.some((property) => {
    const next =
      property.type === 'Property' ? property.value : property.argument;
    return doesPatternBindRequire(next, name);
  });
}
