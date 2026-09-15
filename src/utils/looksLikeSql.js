const SQL_LANG = /\b(language-sql|lang-sql|language-snowflake|language-tsql|language-mysql|language-pgsql|language-bigquery|language-plsql)\b/i;
const NOT_SQL_LANG = /\b(language-json|lang-json|language-ya?ml|language-python|language-py|language-bash|language-sh|language-js|language-javascript|language-ts|language-tsx|language-html|language-xml|language-hcl|language-toml)\b/i;
const SQL_START = /^(WITH|SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|MERGE|COPY|EXPLAIN|QUALIFY|CALL|BEGIN|DECLARE)\b/i;

export function looksLikeSql(text, className = '') {
  const lang = String(className || '');
  if (SQL_LANG.test(lang)) return true;
  if (NOT_SQL_LANG.test(lang)) return false;
  const snippet = String(text || '').trim();
  if (snippet.length < 16) return false;
  return SQL_START.test(snippet);
}

export function playgroundSqlHref(sql, limit = 4000, problem) {
  const clipped = String(sql || '').slice(0, limit);
  const href = `/tools/sql-playground?sql=${encodeURIComponent(clipped)}`;
  if (!problem) return href;
  return `${href}&problem=${encodeURIComponent(problem)}`;
}
