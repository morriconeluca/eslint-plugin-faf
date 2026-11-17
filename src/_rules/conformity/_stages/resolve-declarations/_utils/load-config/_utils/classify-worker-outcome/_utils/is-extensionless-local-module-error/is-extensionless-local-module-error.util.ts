import nodePathPosix from 'node:path/posix';

export function isExtensionlessLocalModuleError(message: string): boolean {
  const quotedMatch =
    /Cannot find module (['"])(.+?)\1(?: imported from |$)/mu.exec(message);
  const unquotedMatch =
    /Cannot find module ([^\s'"]+)(?: imported from |$)/mu.exec(message);
  const target = quotedMatch?.[2] ?? unquotedMatch?.[1] ?? '';

  const isLocalPath = /^(?:\/|\.\.?\/|file:|\\\\|[A-Za-z]:[/\\])/u.test(target);
  if (
    !isLocalPath ||
    target.includes('/node_modules/') ||
    target.includes('\\node_modules\\')
  ) {
    return false;
  }

  const resolvedPath =
    target.startsWith('file:') && URL.canParse(target)
      ? new URL(target).pathname
      : target;
  const queryIndex = resolvedPath.search(/[?#]/u);
  const pathOnly =
    queryIndex === -1 ? resolvedPath : resolvedPath.slice(0, queryIndex);
  const basename = nodePathPosix.basename(pathOnly.replaceAll('\\', '/'));

  return basename !== '' && nodePathPosix.extname(basename) === '';
}
