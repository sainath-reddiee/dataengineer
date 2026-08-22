// Writes public/well-known/agent-skills/index.json with sha256 digests.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = path.join(root, 'public', 'well-known', 'agent-skills');

function sha256File(filePath) {
  const bytes = fs.readFileSync(filePath);
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function descriptionFromSkill(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return '';
  const desc = match[1].match(/^description:\s+(.+)$/m);
  return desc ? desc[1].trim() : '';
}

function nameFromSkill(markdown, fallback) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return fallback;
  const name = match[1].match(/^name:\s+([a-z0-9-]+)$/m);
  return name ? name[1] : fallback;
}

const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;
    const markdown = fs.readFileSync(skillPath, 'utf8');
    const name = nameFromSkill(markdown, entry.name);
    const description = descriptionFromSkill(markdown);
    if (!description) {
      throw new Error(`${entry.name}/SKILL.md is missing a description in frontmatter`);
    }
    return {
      name,
      type: 'skill-md',
      description,
      url: `/.well-known/agent-skills/${entry.name}/SKILL.md`,
      digest: sha256File(skillPath),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

const index = {
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills,
};

const indexPath = path.join(skillsDir, 'index.json');
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Wrote ${indexPath} (${skills.length} skill${skills.length === 1 ? '' : 's'})`);
