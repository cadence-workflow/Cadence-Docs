const path = require('path');

// Local Docusaurus plugin that lets us `import data from './foo.yaml'`.
// Scoped to src/data so it never interferes with YAML that other tooling
// (blog authors.yml, tags.yml, etc.) consumes directly.
module.exports = function yamlLoaderPlugin() {
  return {
    name: 'yaml-loader-plugin',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: /\.ya?ml$/,
              include: [path.resolve(__dirname, '..', '..', 'data')],
              use: [path.resolve(__dirname, 'loader.js')],
            },
          ],
        },
      };
    },
  };
};
