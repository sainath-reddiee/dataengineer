// Static HTML entries for the community features (mock exams, roadmaps,
// interview bank, cost estimator v2). Each entry has the ESSENTIAL_PAGES shape
// {path, title, description, content, noindex}. The H1 matches the React H1
// so the static shell and the hydrated page agree.
//
// All of these are held out during AdSense review (isAdSenseNoindexPath);
// mock exams carry noindex permanently because they are app state, not prose.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMockPlan, MOCK_LENGTHS } from '../../src/lib/practice/mockExam.js';
import { resourceHref, resourceTypeLabel } from '../../src/lib/roadmaps/resourceHref.js';
import { cheatsheets } from '../../src/data/cheatsheetData.js';
import { buildBank, STACKS } from '../../src/lib/interview/bank.js';
import { WAREHOUSE_PRICING } from '../../src/data/warehousePricing.js';
import { estimateAll } from '../../src/lib/estimator/warehouseEstimate.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRACTICE_SLUGS = ['snowpro-core', 'snowpro-genai', 'databricks-de', 'aws-de-associate'];

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const readJson = (...parts) => JSON.parse(fs.readFileSync(path.join(root, ...parts), 'utf8'));

export function buildMockExamPages() {
  return PRACTICE_SLUGS.map((slug) => {
    const meta = readJson('src', 'data', 'practice', slug, 'metadata.json');
    const topics = readJson('src', 'data', 'practice', slug, 'topics.json');
    const pool = readJson('src', 'data', 'practice', slug, 'questions.json').length;
    const rows = MOCK_LENGTHS.map((len) => {
      const plan = getMockPlan(meta, pool, len.id);
      return `        <tr><td>${escapeHtml(len.label)}</td><td>${plan.count}</td><td>${Math.round(plan.timeLimitSec / 60)} minutes</td></tr>`;
    }).join('\n');
    const domains = topics.map((t) => `        <li>${escapeHtml(t.name)}: ${t.weight}%</li>`).join('\n');
    return {
      path: `/practice/${slug}/mock-exam`,
      title: `${meta.shortTitle} Timed Mock Exam`,
      description: `Timed ${meta.shortTitle} mock exam at the official pace, with domain-weighted questions, a pass mark and a full answer review.`,
      noindex: true,
      content: `
      <h1>${escapeHtml(meta.shortTitle)} timed mock exam</h1>
      <p>Questions are drawn in proportion to the exam domains and timed at the official pace (${meta.durationMinutes} minutes for ${meta.totalOfficialQuestions} questions). No answers are shown until you submit. The exam runs in your browser and needs JavaScript.</p>
      <h2>Lengths</h2>
      <table>
        <thead><tr><th>Length</th><th>Questions</th><th>Time</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>
      <h2>Domain weights</h2>
      <ul>
${domains}
      </ul>
      <h2>How it works</h2>
      <ul>
        <li>Move freely between questions and flag any you want to revisit.</li>
        <li>The exam submits itself when the clock reaches zero. Unanswered questions count as wrong.</li>
        <li>Progress is saved in this browser, so a refresh does not lose your answers.</li>
        <li>The pass mark shown is ${meta.passingScore}%. Real exams use scaled scoring, so treat it as a guide.</li>
      </ul>
      <p>Prefer instant feedback? Use the <a href="/practice/${slug}">${escapeHtml(meta.shortTitle)} practice modes</a>. DataEngineer Hub is not affiliated with ${escapeHtml(meta.provider)}.</p>
    `,
    };
  });
}

export function loadRoadmaps() {
  const dir = path.join(root, 'src', 'data', 'roadmaps');
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .filter((r) => r.published);
}

export const ROADMAPS_HUB = {
  title: 'Role roadmaps',
  intro: 'Step-by-step learning paths for data roles. Each skill links to a tutorial, cheat sheet, tool or practice test on this site. Tick skills off as you go; progress stays in your browser.',
};

export function buildRoadmapPages() {
  const roadmaps = loadRoadmaps();
  const hub = {
    path: '/roadmaps',
    title: 'Data Engineering Role Roadmaps',
    description: 'Learning roadmaps for data engineers, analytics engineers and data platform engineers, built from tutorials, cheat sheets, tools and practice tests.',
    content: `
      <h1>${ROADMAPS_HUB.title}</h1>
      <p>${ROADMAPS_HUB.intro}</p>
      <ul>
${roadmaps.map((r) => `        <li><a href="/roadmaps/${r.slug}"><strong>${escapeHtml(r.title)}</strong></a>: ${escapeHtml(r.tagline)}</li>`).join('\n')}
      </ul>
    `,
  };
  const pages = roadmaps.map((r) => {
    const stages = r.stages.map((stage, i) => {
      const skills = stage.skills.map((skill) => {
        const links = skill.resources
          .map((res) => `<li>${escapeHtml(resourceTypeLabel(res))}: <a href="${resourceHref(res)}">${escapeHtml(res.label)}</a></li>`)
          .join('');
        return `        <li><strong>${escapeHtml(skill.title)}</strong>${skill.note ? ` ${escapeHtml(skill.note)}` : ''}<ul>${links}</ul></li>`;
      }).join('\n');
      return `      <h2>${i + 1}. ${escapeHtml(stage.title)}</h2>\n      <ul>\n${skills}\n      </ul>`;
    }).join('\n');
    return {
      path: `/roadmaps/${r.slug}`,
      title: r.title,
      description: r.tagline,
      content: `
      <h1>${escapeHtml(r.title)}</h1>
      <p>${escapeHtml(r.tagline)}</p>
${r.intro ? `      <p>${escapeHtml(r.intro)}</p>\n` : ''}${stages}
      <p>See all <a href="/roadmaps">role roadmaps</a>.</p>
    `,
    };
  });
  return [hub, ...pages];
}

export function loadInterviewBank() {
  return buildBank(cheatsheets, readJson('src', 'data', 'interview', 'questions.json'));
}

export function buildInterviewPages(bank = loadInterviewBank()) {
  const groups = STACKS.map((stack) => {
    const items = bank.filter((q) => q.stack === stack.id);
    if (!items.length) return '';
    const list = items
      .map((q) => `        <li>${escapeHtml(q.question)}${q.source ? ` <a href="${q.source}">(${escapeHtml(q.sheetTitle)})</a>` : ''}</li>`)
      .join('\n');
    return `      <h2>${escapeHtml(stack.label)} (${items.length})</h2>\n      <ul>\n${list}\n      </ul>`;
  }).filter(Boolean).join('\n');
  return [
    {
      path: '/interview-prep/questions',
      title: 'Data Engineering Interview Question Bank',
      description: 'Filter data engineering interview questions by stack, topic and level, reveal answers when you are ready, and drill the ones you miss with spaced repetition.',
      content: `
      <h1>Interview question bank</h1>
      <p>${bank.length} questions from the interview cheat sheets. Answers stay hidden until you open them in the interactive bank, and drill mode schedules the ones you miss for review. Each question links to the cheat sheet with the full answer.</p>
${groups}
      <p>Back to <a href="/interview-prep">interview prep</a>.</p>
    `,
    },
    {
      path: '/interview-prep/drill',
      title: 'Interview Drill',
      description: 'Drill data engineering interview questions one at a time with self-rating and spaced repetition.',
      noindex: true,
      content: `
      <h1>Interview drill</h1>
      <p>Answer in your head (or out loud), reveal, then rate yourself honestly. Due reviews come first, then new questions. Drill mode runs in your browser and needs JavaScript; the questions are listed in the <a href="/interview-prep/questions">question bank</a>.</p>
    `,
    },
  ];
}

export function buildEstimatorPages() {
  const rows = [
    ['snowflake', 'Credit', (p) => `$${p.creditPrice} per credit`],
    ['snowflake', 'Storage', (p) => `$${p.storagePerGB} per GB-month`],
    ['databricks', 'DBU (SQL Pro)', (p) => `$${p.dbuPrice} per DBU`],
    ['databricks', 'Storage', (p) => `$${p.storagePerGB} per GB-month`],
    ['bigquery', 'On-demand', (p) => `$${p.onDemandPerTB} per TB scanned`],
    ['bigquery', 'Editions (Enterprise)', (p) => `$${p.editionsPerSlotHour} per slot-hour`],
    ['bigquery', 'Storage (active)', (p) => `$${p.storagePerGB} per GB-month`],
    ['redshift', 'Serverless compute', (p) => `$${p.rpuHourPrice} per RPU-hour`],
    ['redshift', 'Managed storage', (p) => `$${p.storagePerGB} per GB-month`],
  ].map(([id, item, fmt]) => {
    const p = WAREHOUSE_PRICING[id];
    return `        <tr><td>${escapeHtml(p.label)}</td><td>${escapeHtml(item)}</td><td>${escapeHtml(fmt(p))}</td><td><a href="${p.source.url}" rel="noopener noreferrer">${escapeHtml(p.source.title)}</a>, ${p.verifiedOn}</td></tr>`;
  }).join('\n');
  const { results, lowestId } = estimateAll({});
  const example = results.map((r) => `        <li>${escapeHtml(r.label)}: about $${Math.round(r.total).toLocaleString('en-US')} per month (${escapeHtml(r.units)})</li>`).join('\n');
  return [{
    path: '/tools/warehouse-cost-estimator',
    title: 'Warehouse Cost Estimator: Snowflake, Databricks, BigQuery, Redshift',
    description: "Estimate one workload's monthly list-price cost on Snowflake, Databricks, BigQuery and Redshift Serverless, with every unit price, source and formula shown.",
    content: `
      <h1>Warehouse cost estimator</h1>
      <p>Describe one monthly workload and compare list-price estimates for Snowflake, Databricks, BigQuery and Redshift Serverless. Every unit and price is shown with its source and the date it was checked. Contract discounts, egress and reserved capacity are not included. The interactive estimator on this page needs JavaScript.</p>
      <h2>Price assumptions</h2>
      <table>
        <thead><tr><th>Platform</th><th>Item</th><th>List price</th><th>Source, checked</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>
      <h2>Example: 50 TB scanned, 160 compute hours, 500 GB, mixed workload</h2>
      <ul>
${example}
      </ul>
      <p>Lowest list-price estimate for these inputs: ${escapeHtml(results.find((r) => r.id === lowestId).label)}. Equal hours on different engines do not do equal work, so validate with your own queries.</p>
    `,
  }];
}

export function buildCommunityPages() {
  return [...buildMockExamPages(), ...buildRoadmapPages(), ...buildInterviewPages(), ...buildEstimatorPages()];
}
