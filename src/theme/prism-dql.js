Prism.languages.dql = {
    // For token definitions: https://prismjs.com/tokens.html
    // Syntax highlighting for DQL (Data Query Language) used in the DataDog logs
    'comment': [
        {
            pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
            lookbehind: true,
            greedy: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true,
            greedy: true
        }
    ],
    'string': {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    'class-name': {
        pattern: /(\b(?:env|service|operation_name|resource_name|status|ingestion_reason|trace_id)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
            'punctuation': /[.\\]/
        }
    },
    'entity': /\b(?:env|service|operation_name|resource_name|status|ingestion_reason|trace_id)\b/,
    'keyword': /\b(?:by|in|and|not|count|count\sby|stddev|p\d\d)\b/i,
    'boolean': /\b(?:false|true)\b/i,
    'function': /(\b\w+(?=\())|(\w+(?=:))/,
    'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?!\d*percentile)(?:e[+-]?\d+)?/i,
    'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]|->|=>/i,
    'punctuation': /[{}[\];(),.:]/,
    'builtin': {
        pattern: /\b(\d{2}percentile)\b|\b(avg|max|min|sum|set|median|count|is_greater|is_less|is_between|quantile)\b/i,
    },
    'variable': /\$+(?:\w+\b|(?=\{))/,
};

Prism.languages.insertBefore('dql', 'operator', {
    'literal-property': {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: 'property'
    },
});
