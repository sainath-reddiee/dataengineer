import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import MetaTags from '@/components/SEO/MetaTags';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

const CERTIFICATIONS = [
  {
    id: 'snowpro-core',
    title: 'SnowPro Core Certification',
    provider: 'Snowflake',
    questionsCount: 100,
    passingScore: '750/1000',
    timeLimit: '115 Mins',
    isPro: false,
    desc: 'Domain practice tests for Snowflake Data Loading, Micro-partitions, Virtual Warehouses, Time Travel, and Access Control.',
    sampleQuestions: [
      {
        q: 'Which Snowflake feature allows you to query historical data at any point within a defined retention period?',
        options: [
          'Fail-safe',
          'Time Travel',
          'Zero-Copy Clone',
          'Search Optimization Service',
        ],
        answer: 1,
        explanation: 'Time Travel enables accessing historical data (up to 90 days for Enterprise edition) using AT | BEFORE clauses.',
      },
      {
        q: 'What is the maximum retention period for Time Travel in Snowflake Standard Edition?',
        options: ['1 day', '7 days', '30 days', '90 days'],
        answer: 0,
        explanation: 'Snowflake Standard Edition allows up to 1 day of Time Travel. Enterprise Edition allows up to 90 days.',
      },
    ],
  },
  {
    id: 'dbt-analytics-engineer',
    title: 'dbt Certified Analytics Engineer',
    provider: 'dbt Labs',
    questionsCount: 65,
    passingScore: '65%',
    timeLimit: '120 Mins',
    isPro: false,
    desc: 'Covers Jinja/Macros, Incremental Models, dbt Tests, Documentation, Package Management, and CI/CD workflows.',
    sampleQuestions: [
      {
        q: 'Which configuration strategy should be used in dbt to handle out-of-order late arriving events in incremental models?',
        options: [
          'Use unique_key without any lookback window',
          'Include a lookback window (e.g. 3 hours) in the WHERE clause when is_incremental() is true',
          'Set materialization = "table" always',
          'Run dbt clean before every dbt run',
        ],
        answer: 1,
        explanation: 'Including a lookback window (e.g., WHERE updated_at >= MAX(updated_at) - INTERVAL "3 hours") captures late-arriving CDC records.',
      },
    ],
  },
  {
    id: 'databricks-de-associate',
    title: 'Databricks Data Engineer Associate',
    provider: 'Databricks',
    questionsCount: 45,
    passingScore: '70%',
    timeLimit: '90 Mins',
    isPro: false,
    desc: 'Practice questions on Delta Lake, Auto Loader, Multi-hop Architecture (Bronze/Silver/Gold), and Structured Streaming.',
    sampleQuestions: [
      {
        q: 'Which Delta Lake command removes data files no longer referenced by a Delta table transaction log older than the retention threshold?',
        options: ['OPTIMIZE', 'VACUUM', 'COMPACT', 'CLONE'],
        answer: 1,
        explanation: 'VACUUM cleans up uncommitted and unreferenced data files older than the retention threshold (default 7 days).',
      },
    ],
  },
  {
    id: 'aws-de-associate',
    title: 'AWS Certified Data Engineer Associate (DEA-C01)',
    provider: 'AWS',
    questionsCount: 65,
    passingScore: '720/1000',
    timeLimit: '130 Mins',
    isPro: false,
    desc: 'Covers Glue, EMR, Athena, Redshift Serverless, Kinesis, and S3 Lake Formation security policies.',
    sampleQuestions: [
      {
        q: 'Which AWS service provides low-latency serverless interactive SQL queries directly against Amazon S3 data lakes?',
        options: ['Amazon Redshift Serverless', 'Amazon Athena', 'AWS Glue DataBrew', 'EMR Serverless'],
        answer: 1,
        explanation: 'Amazon Athena uses Presto/Trino under the hood to execute serverless interactive SQL directly on Parquet/ORC data stored in S3.',
      },
    ],
  },
];

const CertificationsPrepPage = () => {
  const [activeQuizCert, setActiveQuizCert] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const startQuiz = (cert) => {
    setActiveQuizCert(cert);
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const handleSelectOption = (qIdx, optIdx) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    if (!activeQuizCert) return 0;
    let correct = 0;
    activeQuizCert.sampleQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correct += 1;
    });
    return Math.round((correct / activeQuizCert.sampleQuestions.length) * 100);
  };

  return (
    <div className="certifications-prep-page min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Certification Practice Exams — DataEngineer Hub</title>
        <meta
          name="description"
          content="Practice exams for SnowPro Core, dbt Analytics Engineer, Databricks Data Engineer, and AWS Certified Data Engineer."
        />
        <link rel="canonical" href="https://dataengineerhub.blog/certifications-prep" />
      </Helmet>

      {/* Hero */}
      <div className="max-w-5xl mx-auto text-center mb-12 pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-4">
          <Award className="h-4 w-4 text-emerald-400" /> Certification Exam Center
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          Get Certified with <span className="gradient-text">Confidence</span>
        </h1>
        <p className="mt-3 text-base text-slate-300 max-w-2xl mx-auto">
          Pass your Snowflake, dbt, Databricks, or AWS Data Engineer certification on the first try with domain practice exams.
        </p>
      </div>

      {/* Active Quiz View */}
      {activeQuizCert ? (
        <div className="max-w-3xl mx-auto rounded-3xl border border-blue-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl mb-12">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase text-blue-400">{activeQuizCert.provider} Exam Drill</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{activeQuizCert.title}</h2>
            </div>
            <button
              onClick={() => setActiveQuizCert(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5"
            >
              Exit Quiz
            </button>
          </div>

          <div className="space-y-8">
            {activeQuizCert.sampleQuestions.map((qObj, qIdx) => (
              <div key={qIdx} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                <p className="text-sm sm:text-base font-semibold text-white mb-4">
                  {qIdx + 1}. {qObj.q}
                </p>
                <div className="space-y-2">
                  {qObj.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    const isCorrect = qObj.answer === optIdx;
                    let btnStyle = 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700';

                    if (submitted) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200';
                      } else if (isSelected) {
                        btnStyle = 'border-rose-500/50 bg-rose-500/20 text-rose-200';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-blue-500 bg-blue-500/20 text-blue-200 font-semibold';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-blue-400 block mb-1">Explanation:</span>
                    {qObj.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={Object.keys(selectedAnswers).length < activeQuizCert.sampleQuestions.length}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-xs uppercase tracking-wider text-white shadow-lg disabled:opacity-50"
              >
                Submit Answers
              </button>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm font-bold text-white">
                  Score: <span className="text-emerald-400 text-lg">{calculateScore()}%</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedAnswers({});
                    setSubmitted(false);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl"
                >
                  <RotateCcw className="h-4 w-4" /> Retake Practice Drill
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Certification Cards */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        {CERTIFICATIONS.map((cert) => (
          <div
            key={cert.id}
            className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-slate-900`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  {cert.provider}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  Free Practice Test
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{cert.title}</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">{cert.desc}</p>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center text-xs mb-6">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Questions</div>
                  <div className="font-bold text-white mt-0.5">{cert.questionsCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Time Limit</div>
                  <div className="font-bold text-white mt-0.5">{cert.timeLimit}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Pass Score</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{cert.passingScore}</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startQuiz(cert)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20"
            >
              Start Practice Exam <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificationsPrepPage;
