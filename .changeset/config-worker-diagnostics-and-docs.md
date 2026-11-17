---
'@morriconeluca/eslint-plugin-faf': patch
---

Fix worker configuration diagnostics and documentation: emit the configuration file basename (`nodePath.basename(configPath)`) as the diagnostic `element` instead of an OS-absolute path, restrict `configuration/unresolved-relative-import` to extensionless local `ERR_MODULE_NOT_FOUND` targets (falling back to `configuration/commonjs-package-type` or `configuration/config-load-failure` for explicit-extension missing files, missing packages, and `node_modules` paths), include `roles` in standalone `TFAFConfig` examples, and document `typescript-eslint` parser setup and `externalDependencies` (`from`/`to`) semantics in `README.md`.
