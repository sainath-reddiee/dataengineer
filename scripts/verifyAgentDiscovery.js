// Validates public agent-discovery files without needing a full Vite build.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
let failed = 0;

function ok(message) {
  console.log(`  ✅ ${message}`);
}

function fail(message) {
  failed += 1;
  console.log(`  ❌ ${message}`);
}

const authMd = fs.readFileSync(path.join(publicDir, 'auth.md'), 'utf8');
if (/^#\s+.*auth\.md/im.test(authMd)) ok('auth.md H1 contains auth.md');
else fail('auth.md H1 must contain "auth.md"');
if (/do \*\*not\*\* `POST`/i.test(authMd) || /Do \*\*not\*\* `POST`/i.test(authMd)) {
  ok('auth.md tells agents not to POST registration endpoints');
} else {
  fail('auth.md should warn agents not to POST registration endpoints');
}

const catalog = JSON.parse(fs.readFileSync(path.join(publicDir, 'well-known', 'api-catalog'), 'utf8'));
if (Array.isArray(catalog.linkset) && catalog.linkset.length >= 2) {
  ok(`api-catalog linkset has ${catalog.linkset.length} entries`);
} else {
  fail('api-catalog must be application/linkset+json with a linkset array');
}
for (const entry of catalog.linkset) {
  if (!entry.anchor || !entry['service-desc']) {
    fail(`catalog entry missing anchor or service-desc: ${JSON.stringify(entry).slice(0, 80)}`);
  }
}

const spec = JSON.parse(fs.readFileSync(path.join(publicDir, 'openapi.json'), 'utf8'));
if (spec.openapi && spec.paths['/llm-sitemap.json'] && spec.paths['/.well-known/api-catalog']) {
  ok('openapi.json describes the public read-only catalogs');
} else {
  fail('openapi.json must describe /llm-sitemap.json and /.well-known/api-catalog');
}

const htaccess = fs.readFileSync(path.join(publicDir, '.htaccess'), 'utf8');
const linkHeaderLine = htaccess.split('\n').find((line) => line.includes('Header always set Link'));
if (linkHeaderLine
  && linkHeaderLine.includes('rel=api-catalog')
  && linkHeaderLine.includes('rel=service-desc')
  && linkHeaderLine.includes('rel=service-doc')
  && linkHeaderLine.includes('rel=describedby')
  && !linkHeaderLine.includes('\\"')) {
  ok('.htaccess Link header has unquoted registered relation types');
} else {
  fail('.htaccess Link header must use unquoted rel=api-catalog (LiteSpeed treats \\" as a literal backslash)');
}
if (/RewriteRule \^\\\.well-known\//.test(htaccess)) {
  ok('.htaccess rewrites /.well-known/ to /well-known/');
} else {
  fail('.htaccess must rewrite /.well-known/ for Hostinger-safe deploy');
}
if (!/Header always set Link/.test(htaccess) || !/DEH_AGENT_LINKS/.test(htaccess)) {
  fail('.htaccess must set Link headers only via DEH_AGENT_LINKS (homepage + catalog)');
} else {
  ok('Link headers are scoped to the homepage and api-catalog');
}

const robots = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
if (robots.includes('Allow: /auth.md') && robots.includes('Allow: /.well-known/')) {
  ok('robots.txt allows auth.md and /.well-known/');
} else {
  fail('robots.txt must Allow /auth.md and /.well-known/');
}
if (robots.includes('Content-Signal:') && robots.includes('Agentmap:')) {
  ok('robots.txt has Content-Signal and Agentmap');
} else {
  fail('robots.txt must include Content-Signal and Agentmap');
}

if (!fs.existsSync(path.join(root, 'public', 'index.md'))) {
  fail('public/index.md is required for Accept: text/markdown on the homepage');
} else {
  ok('homepage Markdown representation exists at index.md');
}
if (!/RewriteCond %\{HTTP_ACCEPT\} text\/markdown/.test(htaccess) || !/RewriteRule \^\$ \/index\.md/.test(htaccess)) {
  fail('.htaccess must negotiate Accept: text/markdown to /index.md on /');
} else {
  ok('.htaccess serves index.md when Accept includes text/markdown');
}

const skillsIndexPath = path.join(publicDir, 'well-known', 'agent-skills', 'index.json');
if (!fs.existsSync(skillsIndexPath)) {
  fail('agent-skills/index.json is missing — run npm run agent-skills');
} else {
  const skillsIndex = JSON.parse(fs.readFileSync(skillsIndexPath, 'utf8'));
  if (skillsIndex.$schema === 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
    && Array.isArray(skillsIndex.skills) && skillsIndex.skills.length > 0) {
    ok(`agent-skills index lists ${skillsIndex.skills.length} skill(s)`);
  } else {
    fail('agent-skills index must use schema 0.2.0 and a non-empty skills array');
  }
  for (const skill of skillsIndex.skills || []) {
    const rel = skill.url.replace(/^\/\.well-known\//, '');
    const artifact = path.join(publicDir, 'well-known', rel.replace(/^well-known\//, ''));
    const skillFile = path.join(publicDir, 'well-known', 'agent-skills', skill.name, 'SKILL.md');
    const filePath = fs.existsSync(skillFile) ? skillFile : artifact;
    if (!fs.existsSync(filePath)) {
      fail(`skill artifact missing for ${skill.name}`);
      continue;
    }
    const digest = `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
    if (digest !== skill.digest) {
      fail(`digest mismatch for ${skill.name} — rerun npm run agent-skills`);
    } else {
      ok(`${skill.name} digest matches SKILL.md`);
    }
  }
}

const ard = JSON.parse(fs.readFileSync(path.join(publicDir, 'well-known', 'ai-catalog.json'), 'utf8'));
if (ard.specVersion && ard.host?.identifier && Array.isArray(ard.entries) && ard.entries.length > 0) {
  const bad = ard.entries.filter((entry) => !entry.identifier || !entry.displayName || !entry.type || Boolean(entry.url) === Boolean(entry.data));
  if (bad.length) fail('ARD entries must have identifier, displayName, type, and exactly one of url/data');
  else ok(`ARD catalog has ${ard.entries.length} public entries`);
} else {
  fail('ai-catalog.json must include specVersion, host, and entries');
}

const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (/rel="api-catalog"/.test(homepage) && /rel="describedby"/.test(homepage)) {
  ok('index.html has HTML discovery link relations');
} else {
  fail('index.html must include api-catalog and describedby link tags');
}

if (failed) {
  console.error(`\nAgent discovery checks failed: ${failed}`);
  process.exit(1);
}
console.log('\n✅ Agent discovery files look valid.');
