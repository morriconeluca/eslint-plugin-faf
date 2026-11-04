import type { OxcError } from 'oxc-parser';

import type { TUnsupportedSyntax } from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

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
