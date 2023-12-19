import { defineConfig } from 'tsup';
import { esbuildPluginCJSInterop } from '../../utils/esbuild-plugin-cjs-interop.js';

export default defineConfig({
  esbuildPlugins: [esbuildPluginCJSInterop]
});
