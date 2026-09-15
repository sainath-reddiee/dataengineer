import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEARN_NAV } from '../src/data/learnNav.js';
import { CODING_PROBLEMS, codingProblemHref } from '../src/data/codingProblems.js';
import { playgroundSqlHref } from '../src/utils/looksLikeSql.js';
import { isAdSenseNoindexPath } from '../src/data/adsenseQualityGate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const header = readFileSync(join(root, 'src/components/Header.jsx'), 'utf8');
const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
const playground = readFileSync(join(root, 'src/pages/SqlPlaygroundPage.jsx'), 'utf8');

for (const item of LEARN_NAV.filter((row) => !row.reviewHidden)) {
  assert(header.includes(`path: '${item.path}'`), `Header Learn must include ${item.path}`);
  assert(app.includes(`path="${item.path.replace(/^\//, '')}"`) || app.includes(`path="${item.path.slice(1)}"`), `App must route ${item.path}`);
}

assert(app.includes('StartHerePage'), 'App must mount StartHerePage');
assert(app.includes('CodingHubPage'), 'App must mount CodingHubPage');
assert(app.includes('RoadmapsPage'), 'App must mount RoadmapsPage');
assert(app.includes('ProgressPage'), 'App must mount ProgressPage');
assert(app.includes('CoursesPage'), 'App must mount CoursesPage');
assert(app.includes('CertsHubPage'), 'App must mount CertsHubPage');
assert(app.includes('InterviewQuestionsPage'), 'App must mount InterviewQuestionsPage');
assert(app.includes('PricingPage'), 'App must mount PricingPage');
assert(CODING_PROBLEMS.length >= 16, 'Need an original SQL pad set including Pro pads');
assert(CODING_PROBLEMS.some((p) => p.pro), 'At least one pad should be Hub Pro');
assert(codingProblemHref(CODING_PROBLEMS[0]).includes('problem='), 'Pad links must carry a problem slug');
assert(playgroundSqlHref('SELECT 1', 4000, 'dept-headcount').includes('problem=dept-headcount'), 'Playground href must accept a problem slug');
assert(playground.includes('markSolved'), 'Playground must record solved pads');
assert(isAdSenseNoindexPath('/progress'), '/progress must stay noindex');
assert(isAdSenseNoindexPath('/settings'), '/settings must stay noindex');
assert(!isAdSenseNoindexPath('/coding'), '/coding should stay indexable');
assert(!isAdSenseNoindexPath('/start-here'), '/start-here should stay indexable');
assert(!isAdSenseNoindexPath('/roadmaps'), '/roadmaps should stay indexable');
assert(!isAdSenseNoindexPath('/courses'), '/courses should stay indexable');
assert(!isAdSenseNoindexPath('/interview-questions'), '/interview-questions should stay indexable');

console.log(`✅ Learn surface: ${LEARN_NAV.length} header destinations, ${CODING_PROBLEMS.length} SQL pads, on-device progress`);
