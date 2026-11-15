import { z } from 'zod';

export const configFileSettingsSchema = z.object({
  faf: z.object({
    configFile: z.string(),
  }),
});
