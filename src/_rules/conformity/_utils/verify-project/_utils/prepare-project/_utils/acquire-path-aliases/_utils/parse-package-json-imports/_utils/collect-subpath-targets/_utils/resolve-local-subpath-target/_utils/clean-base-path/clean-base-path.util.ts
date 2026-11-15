export function cleanBasePath(rawBase: string): string {
  const withoutTrailingSlash = rawBase.endsWith('/')
    ? rawBase.slice(0, -1)
    : rawBase;

  return withoutTrailingSlash === '' ? '.' : withoutTrailingSlash;
}
