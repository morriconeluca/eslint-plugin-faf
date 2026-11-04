export function resolveTreeOrigin(
  entryPath: string,
  normalizedOrigins: readonly string[]
): null | string {
  let matchedOrigin: null | string = null;

  for (const origin of normalizedOrigins) {
    if (origin === '.') {
      matchedOrigin = origin;
      continue;
    }

    if (
      (entryPath === origin || entryPath.startsWith(`${origin}/`)) &&
      (matchedOrigin === null || origin.length > matchedOrigin.length)
    ) {
      matchedOrigin = origin;
    }
  }

  return matchedOrigin;
}
