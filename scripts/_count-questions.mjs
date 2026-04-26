import fs from 'node:fs';
const track = process.argv[2] || 'snowpro-core';
const q = JSON.parse(fs.readFileSync(`src/data/practice/${track}/questions.json`, 'utf8'));
const byTopic = {};
const byDiff = {};
const byType = {};
for (const x of q) {
  byTopic[x.topicSlug] = (byTopic[x.topicSlug] || 0) + 1;
  byDiff[x.difficulty] = (byDiff[x.difficulty] || 0) + 1;
  byType[x.type] = (byType[x.type] || 0) + 1;
}
console.log(`track: ${track}`);
console.log(`total: ${q.length}`);
console.log('by topic:', byTopic);
console.log('by difficulty:', byDiff);
console.log('by type:', byType);
// check for dup slugs/ids
const slugs = new Set(), ids = new Set(), dupSlugs = [], dupIds = [];
for (const x of q) {
  if (slugs.has(x.slug)) dupSlugs.push(x.slug);
  if (ids.has(x.id)) dupIds.push(x.id);
  slugs.add(x.slug);
  ids.add(x.id);
}
console.log('duplicate slugs:', dupSlugs);
console.log('duplicate ids:', dupIds);
