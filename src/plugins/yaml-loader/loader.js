const yaml = require('js-yaml');

// Minimal webpack loader: turns a .yaml/.yml file into an ES module whose
// default export is the parsed data. Uses js-yaml, which is already present
// transitively (via Docusaurus/gray-matter), so no new dependency is needed
// and `npm ci` stays in sync with the committed lockfile.
module.exports = function yamlLoader(source) {
  const data = yaml.load(source);
  return `export default ${JSON.stringify(data)};`;
};
