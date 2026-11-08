/**
 * Reader-facing article code blocks.
 *
 * Every article <pre> is wrapped the same way (React + SSG), so crawlers
 * and humans read identical code blocks.
 */
import { detectCodeLanguage } from './adsenseCodeRatio.js';

export const CODE_EXPAND_LINE_THRESHOLD = 16;

const LEDES = {
  SQL: 'SQL statement — review schema and warehouse context before executing.',
  Python: 'Python implementation — review dependencies and connection parameters.',
  PySpark: 'PySpark transformation — verify catalog and DataFrame schema before running.',
  YAML: 'YAML configuration — verify indentation and target profile keys.',
  JSON: 'JSON document — structured configuration or API payload.',
  JavaScript: 'JavaScript module — verify runtime environment and imports.',
  TypeScript: 'TypeScript module — verify type definitions and imports.',
  shell: 'Terminal commands — run in your shell or CI/CD runner.',
  Snippet: 'Configuration snippet — adapt parameters to your environment.',
};

const KEYWORDS = {
  SQL: /\b(SELECT|FROM|WHERE|AND|OR|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|GROUP|BY|ORDER|LIMIT|WITH|AS|INSERT|INTO|VALUES|CREATE|ALTER|DROP|REPLACE|TABLE|VIEW|DATABASE|SCHEMA|WAREHOUSE|ROLE|GRANT|REVOKE|STAGE|STREAM|TASK|PROJECT|DBT|EXECUTE|QUALIFY|HAVING|UNION|ALL|CASE|WHEN|THEN|ELSE|END|NOT|NULL|IN|EXISTS|DISTINCT|OVER|PARTITION|COPY|MERGE|UPDATE|DELETE|SET|USING|CLONE|IFF|COALESCE|DATEADD|DATEDIFF|CURRENT_TIMESTAMP|CURRENT_DATE|COUNT|SUM|AVG|MIN|MAX|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|LATERAL|FLATTEN|PARSE_JSON)\b/gi,
  Python: /\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|None|True|False|yield|async|await|try|except|finally|with|as|lambda|pass|raise|self)\b/g,
  PySpark: /\b(def|class|import|from|return|if|else|for|in|None|True|False|with|as|spark|DataFrame)\b/g,
  JavaScript: /\b(const|let|var|function|return|if|else|for|while|of|in|await|async|import|from|export|class|new|this)\b/g,
  TypeScript: /\b(const|let|var|function|return|if|else|for|while|of|in|await|async|import|from|export|class|new|this|type|interface)\b/g,
  shell: /\b(cd|snow|dbt|git|docker|pip|npm|npx|curl|export|source|echo|cat|grep|mkdir|rm|chmod|sudo|aws|gcloud|az|kubectl|terraform|python|python3|pytest|uv|ollama)\b/g,
};

const NON_TABLE_TOKENS = new Set([
  'table', 'lateral', 'flatten', 'unnest', 'values', 'select', 'where', 'set',
  'only', 'exists', 'not', 'null', 'temp', 'temporary', 'external', 'replace',
  'if', 'the', 'a', 'an', 'stdin', 'stdout', 'dual', 'json', 'parquet', 'csv',
]);

export function decodeEntities(value) {
  let out = String(value || '');
  // Unwrap double-encoded entities from WordPress (e.g. &amp;#91; or &amp;gt;)
  for (let i = 0; i < 2; i += 1) {
    out = out
      .replace(/&amp;/gi, '&')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = Number(dec);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : _;
      })
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : _;
      });
  }
  return out;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function preText(block) {
  let text = String(block || '')
    .replace(/^<pre\b[^>]*>/i, '')
    .replace(/<\/pre>$/i, '')
    .replace(/<span class="article-code-gutter"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<span class="article-code-line"[^>]*>/gi, '\n')
    .replace(/<\/?code\b[^>]*>/gi, '')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<\/?p\b[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return decodeEntities(text)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function alreadyWrapped(html, offset) {
  const before = html.slice(0, offset);
  const start = before.lastIndexOf('<figure');
  if (start === -1) return false;
  const window = before.slice(start);
  if (window.includes('</figure>')) return false;
  return /article-code/.test(window);
}

function extractCleanSqlTable(raw) {
  // Match FROM / INTO / UPDATE / CLONE / JOIN / TABLE followed by an identifier
  const regex = /\b(?:FROM|INTO|UPDATE|CLONE|JOIN|TABLE)\s+([a-zA-Z_][a-zA-Z0-9_$.]{2,48})/gi;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const candidate = match[1].replace(/[();,]/g, '');
    const lower = candidate.toLowerCase();
    if (NON_TABLE_TOKENS.has(lower)) continue;
    if (/\.(py|js|ts|tsx|json|ya?ml|sh|md|txt|env)$/i.test(candidate)) continue;
    return candidate;
  }
  return '';
}

/**
 * Generates an authentic, snippet-specific engineering caption from the code's
 * actual comments, SQL objects, Python symbols, JSON/YAML keys, or CLI commands.
 */
export function deriveCodeLede(text, language) {
  const raw = String(text || '').trim();
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const langLabel =
    language === 'Snippet'
      ? 'Config'
      : language === 'shell'
      ? 'CLI'
      : language;

  if (lines.length === 0) return LEDES[language] || LEDES.Snippet;

  // 1. Check if the author wrote a meaningful leading comment
  const firstComment = lines[0].match(/^(?:--|#|\/\/)\s*(.{3,88})$/);
  if (firstComment) {
    const cleaned = firstComment[1].replace(/^[-=#*\s]+|[-=#*\s]+$/g, '').trim();
    if (/^[a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+(\s*\([^)]+\))?$/i.test(cleaned) || /^dockerfile$/i.test(cleaned)) {
      return `${langLabel} file (${cleaned}) — review parameters before deploying.`;
    }
    if (cleaned.length >= 8 && !/^(todo|fixme|example|sql|python|bash|shell)$/i.test(cleaned)) {
      const sentence = `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1).replace(/\.$/, '')}`;
      return `${langLabel} — ${sentence}.`;
    }
  }

  // 2. SQL statement inspection
  if (language === 'SQL') {
    if (/\bEXECUTE\s+DBT\s+PROJECT\b/i.test(raw)) {
      return 'Snowflake native dbt command — executes the versioned DBT PROJECT object in the warehouse.';
    }
    if (/\bINFORMATION_SCHEMA\b|\bACCOUNT_USAGE\b/i.test(raw)) {
      return 'Snowflake metadata query — inspects execution history, storage, or credit telemetry.';
    }
    const table = extractCleanSqlTable(raw);
    if (/^\s*CREATE\s+[\s\S]*?\bCLONE\b/i.test(raw)) {
      return table
        ? `SQL zero-copy clone (${table}) — creates a metadata pointer without duplicating micro-partitions.`
        : 'SQL zero-copy clone — creates an instant metadata pointer to existing micro-partitions.';
    }
    if (/^\s*(?:CREATE|ALTER|DROP|GRANT|REVOKE)\b/i.test(raw)) {
      const objMatch = raw.match(/\b(?:RESOURCE\s+MONITOR|WAREHOUSE|DATABASE|SCHEMA|DYNAMIC\s+TABLE|ICEBERG\s+TABLE|TABLE|VIEW|TASK|STREAM|MASKING\s+POLICY|ROW\s+ACCESS\s+POLICY|STAGE|ROLE|USER|GIT\s+REPOSITORY|DBT\s+PROJECT)\b/i);
      const objType = objMatch ? objMatch[0].toUpperCase() : 'DDL';
      return table
        ? `SQL ${objType} definition (${table}) — review object privileges and warehouse parameters.`
        : `SQL ${objType} statement — review object names and account permissions before running.`;
    }
    if (/^\s*(?:WITH\b[\s\S]+)?SELECT\b/i.test(raw)) {
      const clauses = [];
      if (/\bJOIN\b/i.test(raw)) clauses.push('joins relations');
      if (/\bWHERE\b/i.test(raw)) clauses.push('filters rows');
      if (/\bGROUP\s+BY\b/i.test(raw)) clauses.push('aggregates groups');
      if (/\bOVER\s*\(/i.test(raw) || /\bQUALIFY\b/i.test(raw)) clauses.push('evaluates window frames');
      const action = clauses.length > 0 ? clauses.slice(0, 2).join(' and ') : 'projects columns';
      return table
        ? `SQL query on ${table} — ${action} (use Run SQL to test in the Playground).`
        : `SQL query — ${action} (use Run SQL to test in the Playground).`;
    }
    if (/^\s*(?:MERGE|INSERT|COPY|UPDATE|DELETE)\b/i.test(raw)) {
      const verb = (raw.match(/^\s*(MERGE|INSERT|COPY|UPDATE|DELETE)\b/i)?.[1] || 'DML').toUpperCase();
      return table
        ? `SQL ${verb} step targeting ${table} — verify staging keys and transaction scope.`
        : `SQL ${verb} operation — verify target table and warehouse context before executing.`;
    }
  }

  // 3. Python / PySpark inspection
  if (language === 'Python' || language === 'PySpark') {
    if (/\bDAG\b|SQLExecuteQueryOperator|PythonOperator|@dag|@task/i.test(raw)) {
      const opMatch = raw.match(/\b(SQLExecuteQueryOperator|PythonOperator|BranchPythonOperator|SnowflakeOperator|CopyFromExternalStageToSnowflake|@task(?:\.[a-z_]+)?)\b/);
      const opLabel = opMatch ? ` (${opMatch[1]})` : '';
      return `${language} orchestration DAG${opLabel} — verify connection IDs and retry arguments.`;
    }
    const fnMatch = raw.match(/\b(?:def|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (fnMatch) {
      return `${language} definition (${fnMatch[1]}) — review input types and error handling.`;
    }
    const assignMatch = raw.match(/^([A-Z_][A-Z0-9_]{2,})\s*=/m) || raw.match(/^([a-z_][a-z0-9_]{2,})\s*=/m);
    if (assignMatch) {
      return `${language} configuration (${assignMatch[1]}) — adapt values to your runtime environment.`;
    }
    const importMatch = raw.match(/\b(?:from|import)\s+([a-zA-Z_][a-zA-Z0-9_.]*)/);
    if (importMatch) {
      return `${language} script (${importMatch[1]}) — verify package version and credentials.`;
    }
  }

  // 4. JSON inspection
  if (language === 'JSON') {
    const keys = [...raw.matchAll(/"([a-zA-Z0-9_$-]{2,28})"\s*:/g)]
      .map((m) => m[1])
      .filter((k, i, arr) => arr.indexOf(k) === i)
      .slice(0, 3);
    if (keys.length > 0) {
      return `JSON payload — defines ${keys.join(', ')}.`;
    }
  }

  // 5. YAML inspection
  if (language === 'YAML') {
    const keys = [...raw.matchAll(/^([a-zA-Z0-9_-]{2,28})\s*:/gm)]
      .map((m) => m[1])
      .filter((k, i, arr) => arr.indexOf(k) === i)
      .slice(0, 3);
    if (keys.length > 0) {
      return `YAML configuration — sets ${keys.join(', ')}.`;
    }
  }

  // 6. Shell / CLI inspection
  if (language === 'shell') {
    const firstCmd = lines.find((l) => !l.startsWith('#')) || lines[0];
    const cleanCmd = firstCmd.replace(/^\$\s*/, '').slice(0, 48);
    if (cleanCmd) {
      return `CLI command — executes ${cleanCmd}${firstCmd.length > 48 ? '…' : ''}.`;
    }
  }

  // 7. Generic Snippet / fallback with first identifier
  const firstCodeLine = lines.find((l) => !l.startsWith('#') && !l.startsWith('--') && !l.startsWith('//')) || lines[0];
  if (firstCodeLine && firstCodeLine.length >= 4) {
    const preview = firstCodeLine.slice(0, 44).trim();
    return `${langLabel} snippet — ${preview}${firstCodeLine.length > 44 ? '…' : ''}`;
  }

  return LEDES[language] || LEDES.Snippet;
}

function highlightCodeSegment(segment, language) {
  let out = segment;

  // SQL / Snowflake @variables and stage references (@WindowStart, @s3_stage)
  if (language === 'SQL' || language === 'Snippet') {
    out = out.replace(/@[a-zA-Z_][a-zA-Z0-9_$.]*/g, '<span class="tok-var">$&</span>');
  }

  // CLI flags (--target, --save-output, -v)
  if (language === 'shell' || language === 'Snippet') {
    out = out.replace(/\b(--[a-zA-Z0-9_-]+|-[a-zA-Z0-9])\b/g, '<span class="tok-flag">$&</span>');
  }

  // Language keywords
  const pattern = KEYWORDS[language];
  if (pattern) {
    pattern.lastIndex = 0;
    out = out.replace(pattern, (match) => `<span class="tok-kw">${match}</span>`);
  }

  return out;
}

function highlightLine(escaped, language) {
  // 1. Full-line comment (starts with # or --)
  if (/^\s*(?:#|--)/.test(escaped)) {
    return `<span class="tok-comment">${escaped}</span>`;
  }

  let line = escaped;

  // 2. Trailing comments
  const commentMatch = line.match(/^([\s\S]*?)(\s+#\s+[\s\S]*|\s+--\s+[\s\S]*)$/);
  let trailingComment = '';
  if (commentMatch) {
    line = commentMatch[1];
    trailingComment = `<span class="tok-comment">${commentMatch[2]}</span>`;
  }

  // 3. Tokenize quoted strings first so keywords inside strings are not double-wrapped
  const parts = [];
  let lastIndex = 0;
  const stringRegex = /(["'])(?:(?=(\\?))\2[\s\S])*?\1/g;
  let match;
  while ((match = stringRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(highlightCodeSegment(line.slice(lastIndex, match.index), language));
    }
    parts.push(`<span class="tok-str">${match[0]}</span>`);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    parts.push(highlightCodeSegment(line.slice(lastIndex), language));
  }

  return parts.join('') + trailingComment;
}

export function renderHighlightedCode(text, language) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  return lines.map((line, index) => {
    const highlighted = highlightLine(escapeHtml(line), language);
    return `<span class="article-code-line"><span class="article-code-gutter" aria-hidden="true">${index + 1}</span><span class="article-code-src">${highlighted || ' '}</span></span>`;
  }).join('');
}

function buildCodeFigure(block, text) {
  const detected = detectCodeLanguage(block, text);
  const language = detected === 'code' ? 'Snippet' : detected;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const lineCount = lines.length;
  const longClass = lineCount >= CODE_EXPAND_LINE_THRESHOLD ? ' is-long' : '';
  const lede = deriveCodeLede(text, language);
  const highlighted = renderHighlightedCode(text, language);

  return `<figure class="article-code${longClass}" data-lang="${escapeHtml(language)}" data-lines="${lineCount}">
      <figcaption class="article-code-bar">
        <span class="article-code-lang">${escapeHtml(language)}</span>
        <span class="article-code-meta">${lineCount} line${lineCount === 1 ? '' : 's'}</span>
        <span class="article-code-actions"></span>
      </figcaption>
      <p class="article-code-lede">${escapeHtml(lede)}</p>
      <pre class="article-code-pre"><code class="language-${escapeHtml(String(language).toLowerCase())}">${highlighted}</code></pre>
      ${lineCount >= CODE_EXPAND_LINE_THRESHOLD
        ? `<button type="button" class="article-code-expand compact-control">Show all ${lineCount} lines</button>`
        : ''}
    </figure>`;
}

export function enhanceArticleCodeBlocks(html) {
  const source = String(html || '');
  if (!source) return source;

  // Upgrade any pre-wrapped <figure class="article-code"> blocks so stale SSG
  // captions or double-encoded entities are refreshed identically.
  const refreshed = source.replace(
    /<figure\s+class="article-code[^"]*"[^>]*>[\s\S]*?(<pre\b[\s\S]*?<\/pre>)[\s\S]*?<\/figure>/gi,
    (fullFigure, innerPre) => {
      const text = preText(innerPre);
      if (!text.trim()) return fullFigure;
      return buildCodeFigure(fullFigure, text);
    }
  );

  return refreshed.replace(/<pre\b[\s\S]*?<\/pre>/gi, (block, offset) => {
    if (alreadyWrapped(refreshed, offset)) return block;
    if (/article-code/.test(block)) return block;

    const text = preText(block);
    if (!text.trim()) return block;

    return buildCodeFigure(block, text);
  });
}
