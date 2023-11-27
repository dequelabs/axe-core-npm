import path from 'path';

/**
 * "Fixes" the esbuild problem of exporting the CJS default export as `module.exports.default`
 * instead of `module.exports`. The plugin appends a block of code to the file that takes the
 * `.default` module export and re-exports it as `module.exports`. It then takes all named
 * exports and re-exports them as part of the `module.exports` under the same name. This also
 * gives the benefit of exporting the `.default` module which allows us to support all 3 export
 * styles: the default export, `.default` export, and named exports.
 *
 * @example
 * // file.ts
 * export default function myFun() {}
 * export const PAGE_STATE = 1
 *
 * // index.cjs
 * // Run-time. all are valid and work
 * const implicitDefaultExport = require('./dist/file.js')
 * const explicitDefaultExport = require('./dist/file.js').default
 * const { PAGE_STATE as namedExport } = require('./dist/file.js')
 */
export const esbuildPluginCJSInterop = {
  name: 'cjs-interop',
  setup(build) {
    build.onEnd(result => {
      if (build.initialOptions.format === 'cjs') {
        result.outputFiles.forEach(file => {
          // make sure we're working with a js/cjs file specifically
          if (!['.js', '.cjs'].includes(path.extname(file.path))) {
            return;
          }

          // merge contents with plugin code
          const contents = new Uint8Array(
            file.contents.length + pluginCode.length
          );
          contents.set(file.contents);
          contents.set(pluginCode, file.contents.length);
          file.contents = contents;
        });
      }
    });
  }
};

const pluginCode = new TextEncoder().encode(`
if (module.exports.default) {
  var ___default_export = module.exports.default;
  var ___export_entries = Object.entries(module.exports);
  module.exports = ___default_export;
  ___export_entries.forEach(([key, value]) => {
    if (module.exports[key]) {
      throw new Error(\`Export "\${key}" already exists on default export\`);
    }

    module.exports[key] = value;
  });
}
`);
