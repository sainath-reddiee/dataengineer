import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { COURSES } from '@/data/coursesCatalog';

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Data engineering courses — Hub paths, not a video dump"
        description="Six original Hub courses: Snowflake cost literacy, dbt grain, Airflow SLAs, Databricks DBU math, interview SQL, and a cert loop without dumps. Each module links a live tool or sheet."
        url="/courses"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          Courses
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Paths that use this site, not another LMS
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          There is no Hub video player. Each course is a sequence of calculators, SQL pads, cheat
          sheets, and interview prompts we already maintain. You finish with an artifact: a cost
          number, a schema.yml, a cron plus on-call contract, or a spoken SQL answer. Start here
          if you do not want a random article.
        </p>
        <div className="mt-10 space-y-8">
          {COURSES.map((course) => (
            <article
              key={course.slug}
              id={course.slug}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl font-bold text-white">{course.title}</h2>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {course.level} · {course.hours}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{course.blurb}</p>
              <p className="mt-2 text-sm text-blue-200/90">
                <span className="font-semibold text-white">You build: </span>
                {course.youBuild}
              </p>
              <ol className="mt-5 space-y-4">
                {course.modules.map((mod, index) => (
                  <li key={mod.title} className="border-t border-white/10 pt-4">
                    <h3 className="text-base font-semibold text-white">
                      {index + 1}. {mod.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{mod.body}</p>
                    <Link
                      to={mod.href}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      {mod.cta} <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-slate-400">
          Role-shaped maps (not courses) live on{' '}
          <Link to="/roadmaps" className="text-blue-400 hover:underline">/roadmaps</Link>.
          Vendor exams are on{' '}
          <Link to="/certs" className="text-blue-400 hover:underline">/certs</Link>.
        </p>
      </div>
    </div>
  );
}
