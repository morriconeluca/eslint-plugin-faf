import { createFixture } from 'fs-fixture';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const ownerPidFileName = 'pid';
const testTemporaryRootName = 'eslint-plugin-faf-tests';
const deadOwnerDirectoryName = 'dead-owner';
const liveOwnerDirectoryName = 'live-owner';

const isOutsideDirectory = (directory: string, ancestor: string): boolean => {
  const relative = path.relative(
    path.resolve(ancestor),
    path.resolve(directory)
  );
  return (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  );
};

const resolveObservedTestTemporaryRoot = (): string =>
  path.dirname(os.tmpdir());

const runIsolatedSetup = (
  livePid: number
): {
  readonly status: null | number;
  readonly stderr: string;
  readonly stdout: string;
} => {
  const setupModuleHref = pathToFileURL(
    path.resolve(import.meta.dirname, '../support/test-temp-dir.ts')
  ).href;
  const script = [
    "import { spawnSync } from 'node:child_process';",
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    `const { setup } = await import(${JSON.stringify(setupModuleHref)});`,
    'const root = path.dirname(process.env.TMPDIR);',
    `const deadDirectory = path.join(root, ${JSON.stringify(deadOwnerDirectoryName)});`,
    `const liveDirectory = path.join(root, ${JSON.stringify(liveOwnerDirectoryName)});`,
    'const exited = spawnSync(process.execPath, ["-e", ""]);',
    'const deadPid = exited.pid;',
    'fs.mkdirSync(deadDirectory, { recursive: true });',
    `fs.writeFileSync(path.join(deadDirectory, ${JSON.stringify(ownerPidFileName)}), String(deadPid));`,
    "fs.writeFileSync(path.join(deadDirectory, 'payload.txt'), 'dead');",
    'fs.mkdirSync(liveDirectory, { recursive: true });',
    `fs.writeFileSync(path.join(liveDirectory, ${JSON.stringify(ownerPidFileName)}), String(${livePid}));`,
    "fs.writeFileSync(path.join(liveDirectory, 'payload.txt'), 'live');",
    'const teardown = setup();',
    'const ownDirectory = process.env.TMPDIR;',
    'const relative = path.relative(process.cwd(), ownDirectory);',
    'const outsideCwd = relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);',
    'const report = {',
    '  deadRemoved: !fs.existsSync(deadDirectory),',
    '  livePreserved: fs.existsSync(path.join(liveDirectory, "payload.txt")),',
    '  outsideCwd,',
    '  ownUnderRoot: path.dirname(ownDirectory) === root,',
    '  tempMatches: process.env.TEMP === ownDirectory,',
    '  tmpMatches: process.env.TMP === ownDirectory,',
    '  tmpdirMatches: process.env.TMPDIR === ownDirectory,',
    '};',
    'teardown();',
    'report.ownRemoved = !fs.existsSync(ownDirectory);',
    'report.livePreservedAfterTeardown = fs.existsSync(path.join(liveDirectory, "payload.txt"));',
    'process.stdout.write(JSON.stringify(report));',
  ].join('\n');
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    {
      encoding: 'utf8',
      env: process.env,
    }
  );
  return {
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  };
};

describe('isolated test temporary directory', () => {
  it('points os.tmpdir() under the test temporary root and outside the working directory', () => {
    const temporaryDirectory = os.tmpdir();
    const root = resolveObservedTestTemporaryRoot();

    expect(fs.statSync(temporaryDirectory).isDirectory()).toBe(true);
    expect(path.basename(root)).toBe(testTemporaryRootName);
    expect(temporaryDirectory.startsWith(`${root}${path.sep}`)).toBe(true);
    expect(isOutsideDirectory(temporaryDirectory, process.cwd())).toBe(true);
    expect(isOutsideDirectory(root, process.cwd())).toBe(true);
    expect(process.env['TMPDIR']).toBe(temporaryDirectory);
    expect(process.env['TMP']).toBe(temporaryDirectory);
    expect(process.env['TEMP']).toBe(temporaryDirectory);
    const ownerPidPath = path.join(temporaryDirectory, ownerPidFileName);
    const ownerPidText = fs.readFileSync(ownerPidPath, 'utf8');
    expect(Number(ownerPidText)).toBe(process.ppid);
  });

  it('creates an fs-fixture directory inside the isolated test temporary directory', async () => {
    const fixture = await createFixture({ 'sample.txt': 'sample' });
    try {
      const fixtureRoot = fs.realpathSync(os.tmpdir());
      expect(
        fs.realpathSync(fixture.path).startsWith(`${fixtureRoot}${path.sep}`)
      ).toBe(true);
      expect(isOutsideDirectory(fixture.path, process.cwd())).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('removes a dead owner at startup, preserves a live owner, and removes its own directory', () => {
    const live = spawn(
      process.execPath,
      ['-e', 'setInterval(() => {}, 1000000)'],
      {
        stdio: 'ignore',
      }
    );
    const root = resolveObservedTestTemporaryRoot();
    const liveDirectory = path.join(root, liveOwnerDirectoryName);
    const deadDirectory = path.join(root, deadOwnerDirectoryName);
    try {
      const livePid = live.pid ?? 0;
      expect(livePid).toBeGreaterThan(0);
      const result = runIsolatedSetup(livePid);
      expect(result).toEqual({
        status: 0,
        stderr: '',
        stdout:
          '{"deadRemoved":true,"livePreserved":true,"outsideCwd":true,"ownUnderRoot":true,"tempMatches":true,"tmpMatches":true,"tmpdirMatches":true,"ownRemoved":true,"livePreservedAfterTeardown":true}',
      });
      expect(fs.existsSync(deadDirectory)).toBe(false);
      const livePayloadPath = path.join(liveDirectory, 'payload.txt');
      expect(fs.existsSync(livePayloadPath)).toBe(true);
      const livePidPath = path.join(liveDirectory, ownerPidFileName);
      const livePidText = fs.readFileSync(livePidPath, 'utf8');
      expect(Number(livePidText)).toBe(livePid);
    } finally {
      live.kill();
      fs.rmSync(liveDirectory, { force: true, recursive: true });
      fs.rmSync(deadDirectory, { force: true, recursive: true });
    }
  });
});
