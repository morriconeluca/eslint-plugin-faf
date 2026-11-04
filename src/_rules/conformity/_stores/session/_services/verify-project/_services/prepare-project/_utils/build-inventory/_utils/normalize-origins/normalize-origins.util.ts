import { toPosixPath } from '../../../../../../../../_session@shared/_utils/to-posix-path/index.js';

export function normalizeOrigins(
  origins: readonly string[]
): readonly string[] {
  return origins.map((rawOrigin) => {
    const posix = toPosixPath(rawOrigin);
    const withoutPrefix = posix.startsWith('./') ? posix.slice(2) : posix;
    return withoutPrefix.endsWith('/') && withoutPrefix.length > 1
      ? withoutPrefix.slice(0, -1)
      : withoutPrefix;
  });
}
