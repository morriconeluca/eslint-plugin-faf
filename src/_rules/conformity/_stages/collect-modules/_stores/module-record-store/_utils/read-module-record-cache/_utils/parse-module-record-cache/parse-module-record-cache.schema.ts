import { z } from 'zod';

const sourceLocationSchema = z.object({
  column: z.number(),
  line: z.number(),
});

const exportOriginSchema = z.discriminatedUnion('type', [
  z.object({
    symbolName: z.string(),
    type: z.literal('local-symbol'),
  }),
  z.object({
    specifier: z.string(),
    type: z.literal('export-all'),
  }),
  z.object({
    specifier: z.string(),
    type: z.literal('namespace'),
  }),
  z.object({
    importedName: z.string(),
    specifier: z.string(),
    type: z.literal('imported-binding'),
  }),
]);

const moduleExportSchema = z.object({
  exportedName: z.string(),
  isTypeOnly: z.boolean(),
  origin: exportOriginSchema,
  position: sourceLocationSchema,
});

const importSyntaxKindSchema = z.enum([
  'css-at-import',
  'css-url',
  'default-import',
  'export-all-from',
  'export-named-from',
  'export-type-from',
  'literal-dynamic-import',
  'mixed-type-specifier-import',
  'named-import',
  'namespace-import',
  'non-literal-dynamic-import',
  'require-call',
  'side-effect-import',
  'type-only-import',
  'typescript-import-type',
  'typescript-require-import',
]);

const moduleImportSchema = z.object({
  isTypeOnly: z.boolean(),
  kind: importSyntaxKindSchema,
  position: sourceLocationSchema,
  specifier: z.string().nullable(),
});

const rootSymbolSchema = z.object({
  name: z.string(),
  position: sourceLocationSchema,
  space: z.enum(['type', 'value']),
});

const unsupportedSyntaxSchema = z.object({
  description: z.string(),
  position: sourceLocationSchema,
});

const moduleRecordSchema = z.object({
  exports: z.array(moduleExportSchema),
  imports: z.array(moduleImportSchema),
  language: z.enum(['binary', 'script', 'style']),
  symbols: z.array(rootSymbolSchema),
  unsupportedSyntaxes: z.array(unsupportedSyntaxSchema),
});

const moduleRecordEntrySchema = z.tuple([z.string(), moduleRecordSchema]);

export const moduleRecordCacheSchema = z.object({
  entries: z.array(moduleRecordEntrySchema),
  packageVersion: z.string(),
  schemaVersion: z.number(),
});
