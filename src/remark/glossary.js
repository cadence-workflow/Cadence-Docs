import { visit } from 'unist-util-visit';

// pattern to match jargon markup with alternate display text
const jargonReplaceRegex = /:([\w+]*):([\w+]*):/g

// match jargon markup
const jargonRegex = /:([\w+]*):/g

function isJargon(node) {
  if (node.value
    && typeof node.value === "string"
    && (node.value.match(jargonRegex) || node.value.match(jargonReplaceRegex)))
    return true;
  return false
}

function visitor(node) {
  if (isJargon(node)) {
    // for now, just remove the jargon markup
    node.value = node.value.replace(/:[\w+]*:([\w+]*):/g, (match, g1) => g1)
      .replace(/:([\w+]*):/g, (match, g1) => g1)
  }
}

function plugin(options = {}) {
  return function transformer(ast) {
    visit(ast, ['text', 'paragraph'], visitor)
  };
}

export default plugin;
