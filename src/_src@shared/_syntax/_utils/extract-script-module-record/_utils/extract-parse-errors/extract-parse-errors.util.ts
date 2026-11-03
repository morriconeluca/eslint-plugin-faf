import type { OxcError } from 'oxc-parser';

import type { TUnsupportedSyntax } from '../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../extract-script-module-record.type.js';

export function extractParseErrors(
  errors: readonly OxcError[],
  locator: TSourceLocator
): readonly TUnsupportedSyntax[] {
  return errors.map((error) => {
    const firstLabel = error.labels[0];
    const start = firstLabel === undefined ? 0 : firstLabel.start;
    return {
      description: error.message,
      position: locator(start),
    };
  });
}
