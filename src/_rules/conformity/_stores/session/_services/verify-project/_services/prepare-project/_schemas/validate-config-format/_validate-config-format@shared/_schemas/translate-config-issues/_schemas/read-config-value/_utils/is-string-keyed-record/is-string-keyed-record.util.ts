export function isStringKeyedRecord(
  value: unknown,
  key: PropertyKey
): value is Record<string, unknown> {
  const objectValue =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value
      : null;
  return (
    objectValue !== null &&
    typeof key === 'string' &&
    Object.hasOwn(objectValue, key)
  );
}
