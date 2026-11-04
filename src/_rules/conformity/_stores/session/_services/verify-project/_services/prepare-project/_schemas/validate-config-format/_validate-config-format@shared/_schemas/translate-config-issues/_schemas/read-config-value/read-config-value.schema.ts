import { isStringKeyedRecord } from './_utils/is-string-keyed-record/index.js';

export function readConfigValue(
  value: unknown,
  segments: readonly PropertyKey[]
): unknown {
  let current = value;
  for (const segment of segments) {
    if (typeof segment === 'number' && Array.isArray(current)) {
      current = current[segment];
      continue;
    }
    if (typeof segment !== 'string' || !isStringKeyedRecord(current, segment)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}
