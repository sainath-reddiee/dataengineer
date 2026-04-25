// src/components/practice/QuestionCard.jsx
import React from 'react';
import { Check, X, Circle, CheckSquare, Square } from 'lucide-react';
import BookmarkButton from './BookmarkButton';

/**
 * Renders a single question with radio/checkbox options.
 * Shows correct/incorrect feedback after submit (in practice mode).
 */
const QuestionCard = ({
  question,
  answerState, // { selectedIds: [], submitted: bool, correct: bool } | null
  onSelect,
  onSubmit,
  showFeedback = true, // false in exam mode
  quizSlug,
}) => {
  if (!question) return null;

  const isMulti = question.type === 'multi';
  const selectedIds = new Set(answerState?.selectedIds || []);
  const submitted = !!answerState?.submitted;
  const correctSet = new Set(question.correctIds);

  const getOptionState = (opt) => {
    if (!submitted || !showFeedback) {
      return selectedIds.has(opt.id) ? 'selected' : 'idle';
    }
    const isSelected = selectedIds.has(opt.id);
    const isCorrect = correctSet.has(opt.id);
    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    return 'idle';
  };

  const optionClasses = (state) => {
    switch (state) {
      case 'correct':
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-100';
      case 'incorrect':
        return 'border-rose-500 bg-rose-500/10 text-rose-100';
      case 'selected':
        return 'border-blue-500 bg-blue-500/10 text-white';
      default:
        return 'border-slate-700 bg-slate-800/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {question.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {isMulti ? 'Multi-select' : question.type === 'truefalse' ? 'True/False' : 'Single answer'}
          </span>
        </div>
        {quizSlug && <BookmarkButton quizSlug={quizSlug} questionId={question.id} />}
      </div>

      <h2 className="text-lg md:text-xl font-semibold text-white mb-6 leading-snug whitespace-pre-wrap">
        {question.stem}
      </h2>

      <ul className="space-y-3">
        {question.options.map((opt) => {
          const state = getOptionState(opt);
          const Icon =
            state === 'correct' ? Check : state === 'incorrect' ? X : isMulti ? (selectedIds.has(opt.id) ? CheckSquare : Square) : Circle;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => !submitted && onSelect(question.id, opt.id, isMulti)}
                disabled={submitted}
                className={`w-full text-left flex items-start gap-3 border rounded-lg px-4 py-3 transition-colors ${optionClasses(state)} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <Icon className="w-5 h-5 mt-0.5 shrink-0" aria-hidden />
                <span className="flex-1 whitespace-pre-wrap">{opt.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {!submitted && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onSubmit(question.id)}
            disabled={selectedIds.size === 0}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium transition-colors"
          >
            Submit
          </button>
        </div>
      )}

      {submitted && showFeedback && (
        <div
          className={`mt-6 rounded-lg border p-4 ${answerState.correct ? 'border-emerald-600/50 bg-emerald-900/20' : 'border-rose-600/50 bg-rose-900/20'}`}
        >
          <div className={`text-sm font-semibold mb-2 ${answerState.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
            {answerState.correct ? 'Correct' : 'Incorrect'}
          </div>
          <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">{question.explanation}</div>
          {question.references?.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="text-slate-400 mb-1">References:</div>
              <ul className="list-disc list-inside space-y-1">
                {question.references.map((r) => (
                  <li key={r}>
                    <a
                      href={r}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline break-all"
                    >
                      {r}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
