import type { BindingPattern, BindingRestElement } from 'oxc-parser';

import type { TPatternIdentifier } from './collect-pattern-identifiers.type.js';

export function collectPatternIdentifiers(
  pattern: BindingPattern | BindingRestElement,
  results: TPatternIdentifier[]
): void {
  switch (pattern.type) {
    case 'ArrayPattern': {
      for (const element of pattern.elements) {
        if (element !== null) {
          collectPatternIdentifiers(element, results);
        }
      }
      return;
    }
    case 'AssignmentPattern': {
      collectPatternIdentifiers(pattern.left, results);
      return;
    }
    case 'Identifier': {
      results.push({ name: pattern.name, start: pattern.start });
      return;
    }
    case 'ObjectPattern': {
      for (const property of pattern.properties) {
        const next =
          property.type === 'Property' ? property.value : property.argument;
        collectPatternIdentifiers(next, results);
      }
      return;
    }
    case 'RestElement': {
      collectPatternIdentifiers(pattern.argument, results);
      return;
    }
  }
}
