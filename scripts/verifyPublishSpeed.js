// Guardrail: a WordPress publish must not kick a full Vite + --force rebuild.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const workflow = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
const incremental = readFileSync(join(root, 'scripts/generateStaticPagesIncremental.js'), 'utf8');

assert(
  workflow.includes('WordPress publish — skip Vite, incremental pages only'),
  'repository_dispatch must not treat the last main commit as a code change'
);
assert(
  workflow.includes('build_flags=--slug=$WP_SLUG_FLAG'),
  'WordPress publish must rebuild only the changed slug'
);
assert(
  workflow.includes("github.event_name != 'repository_dispatch'"),
  'Vite must not run on every post publish'
);
assert(
  workflow.includes('Ensure dist exists after a content-only publish'),
  'content-only publish must fall back to Vite only when dist is missing'
);
assert(
  incremental.includes('onlySlug') && incremental.includes('--slug='),
  'incremental generator must accept --slug for a single-article rebuild'
);

console.log('✅ WordPress publish stays incremental (no full Vite/--force on every update)');
