import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useReadingList } from '@/hooks/useReadingList';
import { codingProblemBySlug, codingProblemHref } from '@/data/codingProblems';
import { interviewQuestionById } from '@/data/interviewQuestionBank';

export default function SavedPage() {
  const { coding, questions, toggleCoding, toggleQuestion } = useSavedItems();
  const { items, count } = useReadingList();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Saved — pads, questions, reading list"
        description="SQL pads and interview prompts you starred, plus the article reading list. Stored in this browser."
        url="/saved"
        noindex
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          This browser
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Saved</h1>
        <p className="mt-4 text-base text-slate-300">
          Stars on SQL pads and interview prompts, plus the article reading list. Nothing is
          uploaded. Switch phones and it will not follow you — export is not a Hub feature yet.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">SQL pads</h2>
          {coding.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              Star a pad on <Link to="/coding" className="text-blue-400 hover:underline">/coding</Link>.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {coding.map((slug) => {
                const problem = codingProblemBySlug(slug);
                return (
                  <li key={slug} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2">
                    <Link to={problem ? codingProblemHref(problem) : '/coding'} className="text-blue-300 hover:underline">
                      {problem?.title || slug}
                    </Link>
                    <button type="button" onClick={() => toggleCoding(slug)} className="text-xs text-slate-500">
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Interview prompts</h2>
          {questions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              Bookmark a prompt on{' '}
              <Link to="/interview-questions" className="text-blue-400 hover:underline">the bank</Link>.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {questions.map((id) => {
                const q = interviewQuestionById(id);
                return (
                  <li key={id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2">
                    <Link to="/interview-questions" className="text-blue-300 hover:underline">
                      {q?.title || id}
                    </Link>
                    <button type="button" onClick={() => toggleQuestion(id)} className="text-xs text-slate-500">
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Reading list ({count})</h2>
          {count === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              Save articles from the library. Full list also lives at{' '}
              <Link to="/reading-list" className="text-blue-400 hover:underline">/reading-list</Link>.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {items.slice(0, 20).map((item) => (
                <li key={item.slug}>
                  <Link to={`/articles/${item.slug}`} className="text-blue-400 hover:underline">
                    {item.title || item.slug}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
