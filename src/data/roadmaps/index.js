// src/data/roadmaps/index.js
// Registry of role roadmaps. Skill ids are permanent: reader progress is
// stored against them, so rename the title, never the id.
import dataEngineer from './data-engineer.json';
import analyticsEngineer from './analytics-engineer.json';
import dataPlatformEngineer from './data-platform-engineer.json';

const ALL = [dataEngineer, analyticsEngineer, dataPlatformEngineer];

export const ROADMAPS = ALL.filter((r) => r.published);
export const ROADMAP_SLUGS = ROADMAPS.map((r) => r.slug);

export function getRoadmap(slug) {
  return ROADMAPS.find((r) => r.slug === slug) || null;
}
