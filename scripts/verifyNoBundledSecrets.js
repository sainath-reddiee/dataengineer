// Guardrail: no credentials in the public JavaScript.
//
// Every VITE_* variable is compiled into the bundle that every visitor
// downloads. A WordPress Application Password once shipped this way, inside a
// Basic-auth header, readable by anyone. This check fails the build if:
//   - the deploy workflow passes a secret-looking VITE_* variable to the build
//   - source code reads a secret-looking VITE_* variable
//   - the built bundle contains a Basic-auth literal or a GitHub token
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SECRET_NAME = /VITE_[A-Z0-9_]*(PASSWORD|PASSWD|SECRET|PRIVATE|APP_PASS|PAT\b|_TOKEN)/;
let failed = 0;
const fail = (msg) => { console.error(`❌ ${msg}`); failed += 1; };

const walk = (dir, exts, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
};

const workflow = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
for (const line of workflow.split('\n')) {
  const m = line.match(SECRET_NAME);
  if (m) fail(`deploy.yml passes ${m[0]} to the build; it would be public in the bundle`);
}

for (const file of walk(join(root, 'src'), ['.js', '.jsx'])) {
  const m = readFileSync(file, 'utf8').match(SECRET_NAME);
  if (m) fail(`${file.slice(root.length + 1)} reads ${m[0]}; secrets must stay server-side`);
}

const bundle = walk(join(root, 'dist/assets'), ['.js']);
for (const file of bundle) {
  const text = readFileSync(file, 'utf8');
  if (/Authorization:\s*[`"']Basic [A-Za-z0-9+/=]{16,}/.test(text)) {
    fail(`${file.slice(root.length + 1)} contains a hard-coded Basic-auth credential`);
  }
  if (/\b(ghp|github_pat)_[A-Za-z0-9_]{20,}/.test(text)) {
    fail(`${file.slice(root.length + 1)} contains a GitHub token`);
  }
}

// Dodo Payments secrets live only in wp-config.php on the server. Placeholders
// such as 'whsec_paste-secret' are short or contain '-', so they do not match.
const DODO_SECRET = /\bwhsec_[A-Za-z0-9+/=]{24,}/g;
// The Standard Webhooks spec's published test vector (used by
// verifyCheckout.js to prove the signer is correct). Public, not a key.
const PUBLIC_TEST_SECRETS = new Set(['whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw']);
const hasDodoSecret = (text) => (text.match(DODO_SECRET) || []).some((m) => !PUBLIC_TEST_SECRETS.has(m));
const DODO_KEY = /DEHUB_DODO_API_KEY'\s*,\s*'(?!paste)[^']{16,}'/;
const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
const trackedFiles = tracked.status === 0 ? tracked.stdout.split('\n').filter((f) => /\.(js|jsx|mjs|cjs|json|php|md|txt|html|yml|yaml|env)$/.test(f)) : [];
for (const rel of trackedFiles) {
  const file = join(root, rel);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  if (hasDodoSecret(text)) fail(`${rel} contains a Dodo webhook signing secret (whsec_...); rotate it in the Dodo dashboard`);
  if (DODO_KEY.test(text)) fail(`${rel} contains a Dodo API key; revoke it in the Dodo dashboard`);
}
for (const file of bundle) {
  if (hasDodoSecret(readFileSync(file, 'utf8'))) fail(`${file.slice(root.length + 1)} contains a Dodo webhook signing secret`);
}
for (const file of walk(join(root, 'src'), ['.js', '.jsx'])) {
  if (/VITE_[A-Z0-9_]*DODO/.test(readFileSync(file, 'utf8'))) fail(`${file.slice(root.length + 1)} reads a VITE_*DODO variable; Dodo keys must stay in WordPress`);
}

if (failed > 0) {
  console.error(`\n❌ Secret scan failed (${failed}). Revoke anything that shipped, then remove it from the build.`);
  process.exit(1);
}
console.log(`✅ No secrets in the build config, source, ${trackedFiles.length} tracked files, or ${bundle.length} bundle files`);
