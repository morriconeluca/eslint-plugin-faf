import type { BindingPattern, BindingRestElement } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

export function collectPatternBindings(
  pattern: BindingPattern | BindingRestElement,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void {
  switch (pattern.type) {
    case 'ArrayPattern': {
      for (const element of pattern.elements) {
        if (element !== null) {
          collectPatternBindings(element, locator, symbols);
        }
      }
      return;
    }
    case 'AssignmentPattern': {
      collectPatternBindings(pattern.left, locator, symbols);
      return;
    }
    case 'Identifier': {
      symbols.push({
        name: pattern.name,
        position: locator(pattern.start),
        space: 'value',
      });
      return;
    }
    case 'ObjectPattern': {
      for (const property of pattern.properties) {
        const next =
          property.type === 'Property' ? property.value : property.argument;
        collectPatternBindings(next, locator, symbols);
      }
      return;
    }
    case 'RestElement': {
      collectPatternBindings(pattern.argument, locator, symbols);
      return;
    }
  }
}
