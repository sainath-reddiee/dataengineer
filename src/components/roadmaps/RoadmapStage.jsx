// src/components/roadmaps/RoadmapStage.jsx
import React from 'react';
import SkillItem from './SkillItem';

const RoadmapStage = ({ stage, index, isDone, onToggle }) => {
  const done = stage.skills.filter((s) => isDone(s.id)).length;
  return (
    <section aria-labelledby={`stage-${stage.id}`} className="mb-8">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id={`stage-${stage.id}`} className="text-xl font-semibold text-white">
          <span className="font-mono text-slate-500 mr-2">{index + 1}.</span>
          {stage.title}
        </h2>
        <span className="text-sm text-slate-400 shrink-0">{done}/{stage.skills.length}</span>
      </div>
      <ol className="space-y-3">
        {stage.skills.map((skill) => (
          <SkillItem key={skill.id} skill={skill} done={isDone(skill.id)} onToggle={onToggle} />
        ))}
      </ol>
    </section>
  );
};

export default RoadmapStage;
