import { visit } from 'unist-util-visit';

// Match jargon markup: `:term:`, or `:term:display:` to show different text
// (e.g. `:activity:activities:`). The term must be a non-empty identifier
// that starts with a letter and is not glued to a preceding letter, digit, or
// colon, so text such as `WorkflowAPI::StartWorkflowExecution` or `10:30:00`
// is left untouched.
const jargonRegex = /(?<![A-Za-z0-9:]):([A-Za-z]\w*):(?:(\w+):)?/g

function visitor(node) {
  if (typeof node.value === 'string') {
    // for now, just remove the jargon markup
    node.value = node.value.replace(jargonRegex,
      (match, term, display) => display ?? term)
  }
}

function plugin(options = {}) {
  return function transformer(ast) {
    visit(ast, 'text', visitor)
  };
}

export default plugin;
