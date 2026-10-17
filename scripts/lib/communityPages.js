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

export function buildCommunityPages() {
  return [...buildMockExamPages(), ...buildRoadmapPages()];
}
