import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const temporaryDirectoryEnvironmentNames = ['TEMP', 'TMP', 'TMPDIR'] as const;
const testTemporaryRootName = 'eslint-plugin-faf-tests';
const ownerPidFileName = 'pid';
const stagingDirectoryPrefix = `.${testTemporaryRootName}-`;

const readSystemErrorCode = (error: unknown): string | undefined => {
  if (!(error instanceof Error) || !('code' in error)) {
    return undefined;
  }
  const { code } = error;
  return typeof code === 'string' ? code : undefined;
};

const failUnexpected = (action: string, code = 'unknown'): never =>
  assert.fail(`Unexpected ${action} failure: ${code}`);

const parseOwnerPid = (content: string): number | undefined => {
  const trimmed = content.trim();
  if (!/^[1-9]\d*$/u.test(trimmed)) {
    return undefined;
  }
  const pid = Number(trimmed);
  return Number.isSafeInteger(pid) ? pid : undefined;
};

const readDirectoryEntries = (directory: string): readonly fs.Dirent[] => {
  try {
    return fs.readdirSync(directory, { withFileTypes: true });
  } catch (error: unknown) {
    const code = readSystemErrorCode(error);
    return code === 'ENOENT' ? [] : failUnexpected('directory read', code);
  }
};

const readOwnerPid = (directory: string): number | undefined => {
  try {
    return parseOwnerPid(
      fs.readFileSync(path.join(directory, ownerPidFileName), 'utf8')
    );
  } catch (error: unknown) {
    const code = readSystemErrorCode(error);
    return code === 'ENOENT'
      ? undefined
      : failUnexpected('owner pid read', code);
  }
};

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: unknown) {
    const code = readSystemErrorCode(error);
    if (code === 'ESRCH') {
      return false;
    }
    if (code === 'EPERM') {
      return true;
    }
    return failUnexpected('process existence check', code);
  }
};

const isOwnedByLivingProcess = (directory: string): boolean => {
  const ownerPid = readOwnerPid(directory);
  return ownerPid !== undefined && isProcessAlive(ownerPid);
};

const resolveOriginalSystemTemporaryDirectory = (): string => {
  const configured =
    process.env['TMPDIR'] ?? process.env['TMP'] ?? process.env['TEMP'];
  if (configured === undefined || configured.length === 0) {
    return os.tmpdir();
  }
  const resolved = path.resolve(configured);
  const segments = resolved.split(path.sep);
  const markerIndex = segments.lastIndexOf(testTemporaryRootName);
  if (markerIndex <= 0) {
    return markerIndex === -1 ? resolved : path.parse(resolved).root;
  }
  const parent = segments.slice(0, markerIndex).join(path.sep);
  return parent.length > 0 ? parent : path.parse(resolved).root;
};

const resolveTestTemporaryRoot = (systemTemporaryDirectory: string): string =>
  path.join(systemTemporaryDirectory, testTemporaryRootName);

export const resolveExecutionTestTemporaryDirectory = (): string =>
  path.join(
    resolveTestTemporaryRoot(resolveOriginalSystemTemporaryDirectory()),
    String(process.pid)
  );

const removeDirectory = (directory: string): void => {
  fs.rmSync(directory, { force: true, recursive: true });
};

const isStaleExecutionDirectory = (entry: fs.Dirent, root: string): boolean =>
  entry.isDirectory() &&
  entry.name !== String(process.pid) &&
  !isOwnedByLivingProcess(path.join(root, entry.name));

const removeStaleExecutionDirectories = (root: string): void => {
  for (const entry of readDirectoryEntries(root)) {
    if (isStaleExecutionDirectory(entry, root)) {
      removeDirectory(path.join(root, entry.name));
    }
  }
};

const publishExecutionDirectory = (
  systemTemporaryDirectory: string,
  directory: string
): void => {
  const stagingDirectory = path.join(
    systemTemporaryDirectory,
    `${stagingDirectoryPrefix}${process.pid}`
  );
  removeDirectory(stagingDirectory);
  fs.mkdirSync(stagingDirectory);
  fs.writeFileSync(
    path.join(stagingDirectory, ownerPidFileName),
    String(process.pid)
  );
  fs.mkdirSync(path.dirname(directory), { recursive: true });
  removeDirectory(directory);
  fs.renameSync(stagingDirectory, directory);
};

const assignTestTemporaryDirectoryEnvironment = (directory: string): void => {
  for (const name of temporaryDirectoryEnvironmentNames) {
    process.env[name] = directory;
  }
};

export const setup = (): (() => void) => {
  const directory = resolveExecutionTestTemporaryDirectory();
  publishExecutionDirectory(
    resolveOriginalSystemTemporaryDirectory(),
    directory
  );
  removeStaleExecutionDirectories(path.dirname(directory));
  assignTestTemporaryDirectoryEnvironment(directory);
  return (): void => {
    removeDirectory(directory);
  };
};
