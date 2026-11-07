import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = fileURLToPath(new URL('./', import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');
const TYPESCRIPT_EXTENSION = '.ts';
const JAVASCRIPT_EXTENSION = '.js';

const isRelativeJavaScriptSpecifier = (specifier: string): boolean =>
  specifier.startsWith('.') && specifier.endsWith(JAVASCRIPT_EXTENSION);

const rewriteScriptSpecifier = (
  specifier: string,
  parentURL: string
): string | undefined => {
  const parentPath = fileURLToPath(parentURL);
  if (
    !parentPath.startsWith(REPOSITORY_ROOT) ||
    parentPath.includes('/node_modules/')
  ) {
    return undefined;
  }
  const rewritten = `${specifier.slice(0, -JAVASCRIPT_EXTENSION.length)}${TYPESCRIPT_EXTENSION}`;
  const resolved = path.resolve(path.dirname(parentPath), rewritten);
  return fs.existsSync(resolved) ? rewritten : undefined;
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parentURL = context.parentURL;
    const canRewrite =
      parentURL !== undefined && isRelativeJavaScriptSpecifier(specifier);
    const rewritten = canRewrite
      ? rewriteScriptSpecifier(specifier, parentURL)
      : undefined;
    return nextResolve(rewritten ?? specifier, context);
  },
});
