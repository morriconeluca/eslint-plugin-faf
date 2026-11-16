---
'@morriconeluca/eslint-plugin-faf': patch
---

Extract TypeScript triple-slash file reference directives (`/// <reference path="..." />`) as `typescript-reference-path` imports, preserve `#` stylesheet subpath aliases containing `/`, and match declared path aliases after CSS bare-specifier fallback in `resolveSpecifiers`.
