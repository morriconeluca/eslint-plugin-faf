import type { ESLint } from 'eslint';

import { PLUGIN_NAME } from './constants.js';

export interface FafPlugin extends ESLint.Plugin {
  meta: PluginMeta;
}

export interface PluginMeta {
  name: string;
  version?: string;
}

export const configs: ESLint.Plugin['configs'] = {};

export const meta: PluginMeta = {
  name: PLUGIN_NAME,
};

export const rules: ESLint.Plugin['rules'] = {};

const plugin: FafPlugin = {
  configs,
  meta,
  rules,
};

export { PLUGIN_NAME } from './constants.js';
export default plugin;
