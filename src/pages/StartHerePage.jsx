import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { START_HERE_PATHS } from '@/data/startHerePaths';
import StartHerePaths from '@/components/StartHerePaths';

export default function StartHerePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Start here — free data engineering plan"
        description="Pick a warehouse, transform, interview, or certification track. SQL coding, practice tests, and cheat sheets stay in the browser. No signup."
        url="/start-here"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          DataEngineer Hub
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Start here — four tracks, nothing behind a login
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          This is the Hub plan: production tutorials, in-browser SQL pads, a 14-day interview
          loop, and timed cert quizzes. Progress is stored on this device. There is no Pro
          unlock for medium problems — the pads and quizzes you see are the full set we ship.
        </p>
        <div className="mt-8">
          <StartHerePaths />
        </div>
        <ol className="mt-10 space-y-4 text-sm text-slate-300">
          <li>
            <strong className="text-white">1. Pick a warehouse track.</strong>{' '}
            {START_HERE_PATHS[0].blurb} Then open{' '}
            <Link to="/articles" className="text-blue-400 hover:underline">articles</Link>.
          </li>
          <li>
            <strong className="text-white">2. Write SQL you can defend.</strong> Eight original
            pads on the sample tables live at{' '}
            <Link to="/coding" className="text-blue-400 hover:underline">/coding</Link>. They run
            in the DuckDB playground.
          </li>
          <li>
            <strong className="text-white">3. Sit the interview or the cert.</strong>{' '}
            <Link to="/interview-prep" className="text-blue-400 hover:underline">Interview prep</Link>
            {' '}and{' '}
            <Link to="/practice" className="text-blue-400 hover:underline">practice tests</Link>
            {' '}are different URLs on purpose.
          </li>
          <li>
            <strong className="text-white">4. Check this browser.</strong>{' '}
            <Link to="/progress" className="text-blue-400 hover:underline">/progress</Link> shows
            solved pads, quiz attempts, and the reading list. Nothing is uploaded.
          </li>
        </ol>
        <Link
          to="/roadmaps"
          className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-blue-400"
        >
          Role roadmaps <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
