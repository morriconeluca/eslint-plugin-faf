import type { BindingPattern, BindingRestElement } from 'oxc-parser';

import { BINDING_PATTERN_TYPES } from '../../extract-traversal-entries.constant.js';
import { isRecord } from '../is-record/index.js';

export function isBindingPattern(
  value: unknown
): value is BindingPattern | BindingRestElement {
  return (
    isRecord(value) &&
    typeof value['type'] === 'string' &&
    BINDING_PATTERN_TYPES.has(value['type'])
  );
}
