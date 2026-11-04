import nodeFs from 'node:fs';
import nodePath from 'node:path';
import nodeUrl from 'node:url';
import {
  MessageChannel,
  receiveMessageOnPort,
  Worker,
} from 'node:worker_threads';

import type {
  TLoadConfigInput,
  TLoadConfigResult,
} from './load-config.type.js';

import { readPackageJson } from '../../../../_verify-project@shared/_adapters/read-package-json/index.js';
import { classifyWorkerOutcome } from './_schemas/classify-worker-outcome/index.js';

export function loadConfig(input: TLoadConfigInput): TLoadConfigResult {
  const resolvedConfigPath = nodePath.resolve(input.configPath);

  const stats = nodeFs.statSync(resolvedConfigPath, {
    throwIfNoEntry: false,
  });

  if (stats === undefined) {
    return {
      ok: false,
      outcomes: [
        {
          constraint: 'configuration/missing-config-file',
          element: resolvedConfigPath,
          family: 'configuration',
          message: `Configuration file not found at path: ${resolvedConfigPath}`,
          normativeReference: 'CONFIG_1',
          propertyPath: 'faf',
        },
      ],
    };
  }

  if (!stats.isFile()) {
    return {
      ok: false,
      outcomes: [
        {
          constraint: 'configuration/missing-config-file',
          element: resolvedConfigPath,
          family: 'configuration',
          message: `Configuration path is not a file: ${resolvedConfigPath}`,
          normativeReference: 'CONFIG_1',
          propertyPath: 'faf',
        },
      ],
    };
  }

  const timeoutBudget = input.timeoutMs ?? 30_000;
  const sharedBuffer = new SharedArrayBuffer(4);
  const int32Array = new Int32Array(sharedBuffer);
  const { port1, port2 } = new MessageChannel();

  const workerScript = `
(async () => {
  let int32ArrayRef;
  try {
    const { workerData } = await import("node:worker_threads");
    const nodeModule = await import("node:module");
    const { fileURLToPath } = await import("node:url");

    int32ArrayRef = workerData.int32Array;
    const { fileUrl, port } = workerData;
    const loadedFiles = [];
    const seenFiles = new Set();

    nodeModule.registerHooks({
      load(url, context, nextLoad) {
        if (url.startsWith("file:") && !url.includes("/node_modules/") && !url.includes("\\\\node_modules\\\\")) {
          try {
            const resolvedFilePath = fileURLToPath(url);
            if (!seenFiles.has(resolvedFilePath)) {
              seenFiles.add(resolvedFilePath);
              loadedFiles.push(resolvedFilePath);
            }
          } catch {}
        }
        return nextLoad(url, context);
      }
    });

    try {
      const loadedModule = await import(fileUrl);
      if (!("default" in loadedModule) || loadedModule.default === undefined) {
        port.postMessage({ kind: "missing", loadedFiles });
        return;
      }

      const defaultExport = loadedModule.default;
      if (typeof defaultExport === "function") {
        port.postMessage({ kind: "function", loadedFiles });
        return;
      }

      if (defaultExport !== null && typeof defaultExport === "object" && typeof defaultExport.then === "function") {
        port.postMessage({ kind: "thenable", loadedFiles });
        return;
      }

      try {
        port.postMessage({ kind: "value", loadedFiles, value: defaultExport });
      } catch (cloneError) {
        const message = cloneError instanceof Error ? cloneError.message : String(cloneError);
        port.postMessage({ kind: "clone-error", message });
      }
    } catch (importError) {
      const code = typeof importError === "object" && importError !== null && "code" in importError && typeof importError.code === "string" ? importError.code : undefined;
      const message = importError instanceof Error ? importError.message : String(importError);
      const name = typeof importError === "object" && importError !== null && "name" in importError && typeof importError.name === "string" ? importError.name : undefined;
      port.postMessage({ error: { code, message, name }, kind: "error" });
    }
  } catch {} finally {
    if (int32ArrayRef) {
      Atomics.store(int32ArrayRef, 0, 1);
      Atomics.notify(int32ArrayRef, 0);
    }
  }
})();
`;

  const worker = new Worker(workerScript, {
    eval: true,
    transferList: [port2],
    workerData: {
      fileUrl: nodeUrl.pathToFileURL(resolvedConfigPath).href,
      int32Array,
      port: port2,
    },
  });

  try {
    const waitResult = Atomics.wait(int32Array, 0, 0, timeoutBudget);
    if (waitResult === 'timed-out') {
      return {
        ok: false,
        outcomes: [
          {
            constraint: 'unverified/config-loading-timeout',
            element: resolvedConfigPath,
            family: 'unverified',
            message: `Loading fafconfig.ts timed out after ${timeoutBudget}ms`,
            normativeReference: 'CONFIG_1',
            reason: `Worker execution exceeded timeout budget of ${timeoutBudget}ms`,
          },
        ],
      };
    }

    const messageWrapper = receiveMessageOnPort(port1);
    const messagePayload: unknown = messageWrapper?.message;

    const configDirectory = nodePath.dirname(resolvedConfigPath);
    const packageJsonResult = readPackageJson({
      directory: configDirectory,
    });
    const packageJson =
      packageJsonResult.ok && packageJsonResult.value.present
        ? packageJsonResult.value.packageJson
        : undefined;

    return classifyWorkerOutcome({
      configPath: resolvedConfigPath,
      packageJson,
      rawMessage: messagePayload,
    });
  } finally {
    port1.close();
    void worker.terminate();
  }
}
