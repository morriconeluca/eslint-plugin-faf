export const readConfigValue = (() => {
  const isStringKeyedRecord = (
    value: unknown,
    key: string
  ): value is Record<string, unknown> => {
    const objectValue =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value
        : null;
    return objectValue !== null && Object.hasOwn(objectValue, key);
  };

  return function readConfigValue(
    value: unknown,
    segments: readonly PropertyKey[]
  ): unknown {
    let current = value;
    for (const segment of segments) {
      if (typeof segment === 'number' && Array.isArray(current)) {
        current = current[segment];
        continue;
      }
      if (
        typeof segment !== 'string' ||
        !isStringKeyedRecord(current, segment)
      ) {
        return undefined;
      }
      current = current[segment];
    }
    return current;
  };
})();
