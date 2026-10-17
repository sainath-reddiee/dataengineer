// src/lib/roadmaps/resourceHref.js
// One mapping from a roadmap resource to its URL, shared by the page, the
// static HTML generator and scripts/verifyRoadmaps.js so all three agree.

export const RESOURCE_TYPES = {
  article: { label: 'Article', href: (ref) => `/articles/${ref}` },
  cheatsheet: { label: 'Cheat sheet', href: (ref) => `/cheatsheets/${ref}` },
  tool: { label: 'Tool', href: (ref) => `/tools/${ref}` },
  practice: { label: 'Practice test', href: (ref) => `/practice/${ref}` },
  mock: { label: 'Mock exam', href: (ref) => `/practice/${ref}/mock-exam` },
};

/** @param {{type: string, ref: string}} resource */
export function resourceHref(resource) {
  const type = RESOURCE_TYPES[resource?.type];
  return type ? type.href(resource.ref) : null;
}

export function resourceTypeLabel(resource) {
  return RESOURCE_TYPES[resource?.type]?.label || 'Link';
}

/** Every skill id in reading order. */
export function skillIds(roadmap) {
  return (roadmap?.stages || []).flatMap((stage) => stage.skills.map((skill) => skill.id));
}

/**
 * Structural problems in a roadmap (empty array when valid). Link targets are
 * checked separately against the built site by scripts/verifyRoadmaps.js.
 */
export function validateRoadmap(roadmap) {
  const problems = [];
  if (!roadmap?.slug || !/^[a-z0-9-]+$/.test(roadmap.slug)) problems.push('slug must be lowercase kebab-case');
  if (!roadmap?.title) problems.push('title is required');
  if (!Array.isArray(roadmap?.stages) || roadmap.stages.length === 0) problems.push('at least one stage is required');
  const seen = new Set();
  for (const stage of roadmap?.stages || []) {
    if (!stage.id || !stage.title) problems.push(`stage ${stage.id || '?'} needs id and title`);
    if (seen.has(`stage:${stage.id}`)) problems.push(`duplicate stage id ${stage.id}`);
    seen.add(`stage:${stage.id}`);
    if (!Array.isArray(stage.skills) || stage.skills.length === 0) problems.push(`stage ${stage.id} has no skills`);
    for (const skill of stage.skills || []) {
      if (!skill.id || !skill.title) problems.push(`skill in ${stage.id} needs id and title`);
      if (seen.has(`skill:${skill.id}`)) problems.push(`duplicate skill id ${skill.id}`);
      seen.add(`skill:${skill.id}`);
      if (!Array.isArray(skill.resources) || skill.resources.length === 0) problems.push(`skill ${skill.id} has no resources`);
      for (const r of skill.resources || []) {
        if (!RESOURCE_TYPES[r.type]) problems.push(`skill ${skill.id}: unknown resource type ${r.type}`);
        if (!r.ref || !r.label) problems.push(`skill ${skill.id}: resource needs ref and label`);
      }
    }
  }
  return problems;
}
