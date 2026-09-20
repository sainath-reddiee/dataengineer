import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Lock, CheckCircle, Sparkles, Zap, ArrowRight, Star, Waves, Snowflake, Wind, Brain, Server, BarChart3, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MetaTags from '@/components/SEO/MetaTags';
import { createDodoCheckoutSession } from '@/services/dodoPaymentsService';

// ─── DataEngineer Hub Pro Pricing Page ──────────────────────────────────────

const STATS = [
  { value: '310+',  label: 'Interview questions' },
  { value: '60',    label: 'Coding problems' },
  { value: '9',     label: 'Data roles' },
];

const FREE_FEATURES = [
  'Easy SQL (Postgres/MySQL) and basic Python problems',
  'Full interview question bank (310+ questions)',
  'Role roadmaps, cheat sheets, and compare guides',
  'Certification practice tests (AWS, Snowflake, dbt)',
  'The full blog — original production writeups',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Medium/Hard SQL: Window functions, recursive CTEs',
  'PySpark, Pandas, and NumPy optimization problems',
  'Data Modeling: dbt, Star Schemas, and Vault',
  'Streaming & Orchestration: Kafka, Airflow DAGs',
  'AI/Vector DBs: Pinecone, RAG, Chunking strategies',
  'Hints, automated tests, and reference solutions',
];

const COMPARISON_ROWS = [
  { surface: 'Easy coding problems',   free: 'Editor, tests, solutions',   pro: 'Editor, tests, solutions' },
  { surface: 'Medium and hard coding', free: 'Locked',                     pro: 'Editor, tests, solutions', freeLocked: true },
  { surface: 'Interview questions',    free: 'Full bank',                   pro: 'Full bank' },
  { surface: 'Blog, roadmaps, certs',  free: 'Yes',                        pro: 'Yes' },
  { surface: '1:1 session',            free: 'No',                         pro: 'No' },
];

const FAQS = [
  {
    q: 'What specific tech stacks are covered in the Pro coding pads?',
    a: 'We cover the entire modern data stack. You will write and execute code for Snowflake/Postgres (Advanced SQL like Window Functions, CTEs, optimizations), PySpark (DataFrame manipulation, salting, skew), Python (Pandas, NumPy for data manipulation), Airflow (DAG design, sensors, XComs), dbt (Jinja, macros, incremental models), and Kafka (Event streaming, exactly-once semantics).',
  },
  {
    q: 'Are the problems based on real FAANG interviews?',
    a: 'Yes. Our questions are curated directly from recent onsite loops at companies like Meta, Netflix, Stripe, and Amazon. We focus heavily on realistic data warehouse modeling, pipeline debugging, and performance optimization scenarios rather than abstract LeetCode algorithms.',
  },
  {
    q: 'What stays free on the platform?',
    a: 'Easy coding pads, the entire interview question bank (310+ questions), the blog, role roadmaps, cheat sheets, and certification practice tests all stay free forever. No account required.',
  },
  {
    q: 'How do payments and subscriptions work?',
    a: 'Pro is $12/mo billed monthly, or save 17% with annual billing at $10/mo ($120/yr). All payments are processed securely via DodoPayments. We do not store your credit card information.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Absolutely. You can cancel with one click from your account dashboard before the next billing date. You will keep your Pro access until the end of your current billing period.',
  },
  {
    q: 'Do you cover AI and Vector Databases for Data Engineers?',
    a: 'Yes! We recently added dedicated tracks for building LLM pipelines, chunking strategies, generating embeddings, and interacting with vector databases like Pinecone and Milvus.',
  },
];

const DATA_ROLES = [
  'Data Analyst', 'BI Analyst', 'Analytics Engineer', 'Data Engineer',
  'Data Scientist', 'ML Engineer', 'MLOps Engineer', 'AI Engineer', 'Data Architect',
];

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const UpgradeProPage = () => {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);

  const monthlyPrice = billing === 'annual' ? 10 : 12;

  useEffect(() => {
    if (isSuccess) {
      try {
        const stored = localStorage.getItem('de_hub_user');
        const user = stored ? JSON.parse(stored) : { name: 'Pro Member', email: 'pro@dataengineer.io' };
        user.plan = 'pro';
        localStorage.setItem('de_hub_user', JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
      } catch { /* ignore */ }
    }
  }, [isSuccess]);

  const handleProCheckout = async () => {
    setLoading(true);
    try {
      const packageKey = billing === 'annual' ? 'pro_annual' : 'pro_monthly';
      const session = await createDodoCheckoutSession({ packageKey });
      if (session?.url) {
        window.open(session.url, '_blank');
      }
    } catch {
      alert('Could not open checkout. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Pricing — DataEngineer Hub"
        description="Start free. Upgrade when you want the medium and hard coding pads that look like the onsite. $12/mo, cancel anytime."
      />

      <div className="min-h-screen bg-[#020817] text-white relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-5xl px-6 py-20 relative z-10">

          {/* ── Success Alert Banner ── */}
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="mb-12 rounded-2xl border border-emerald-500/40 bg-emerald-900/20 p-6 text-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] backdrop-blur-md"
            >
              <div className="inline-flex items-center gap-2 text-emerald-400 font-extrabold text-xl">
                <CheckCircle className="h-7 w-7" />
                <span>Payment Successful! Welcome to DataEngineer Pro!</span>
                <Sparkles className="h-5 w-5 text-amber-300" />
              </div>
              <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                Your account now has full access to all medium & hard SQL & Python practice pads across the entire platform.
              </p>
              <Link
                to="/coding"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-sm font-bold text-[#020817] transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]"
              >
                Go to Coding Hub <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {/* ── Hero ── */}
          <motion.div 
            initial="hidden" 
            animate="show" 
            variants={staggerContainer} 
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Upgrade to Pro</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
              Ace your data interviews.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
              Self-paced prep starts free. Upgrade when you want the medium and hard pads that look exactly like the onsite interviews.
            </motion.p>
          </motion.div>

          {/* ── Billing toggle ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-center mb-12">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
              <button
                onClick={() => setBilling('monthly')}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 ${
                  billing === 'monthly'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  billing === 'annual'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Annual <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${billing === 'annual' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>Save 17%</span>
              </button>
            </div>
          </motion.div>

          {/* ── Pricing cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">

            {/* Free Tier */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.4 }}
              className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 xl:p-10 backdrop-blur-xl flex flex-col transition-all hover:bg-slate-900/60"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
                <p className="text-sm text-slate-400">
                  Perfect for getting started with basics.
                </p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white">$0</span>
                  <span className="text-slate-500 text-base font-medium">/mo</span>
                </div>
                <p className="text-sm text-slate-500 mt-2 font-medium">Free forever, no credit card required.</p>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                    <div className="rounded-full bg-slate-800 p-1 mt-0.5 shrink-0">
                      <Check className="h-3 w-3 text-slate-400" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/coding"
                className="block w-full rounded-xl border border-white/10 bg-transparent hover:bg-white/5 px-4 py-3.5 text-center text-sm font-bold text-white transition-all"
              >
                Start practicing for free
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.5 }}
              className="relative group rounded-3xl"
            >
              {/* Glowing animated border effect */}
              <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-b from-emerald-400 to-teal-600 opacity-70 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
              
              <div className="relative h-full rounded-3xl bg-[#0a1122] p-8 xl:p-10 flex flex-col shadow-2xl overflow-hidden">
                {/* Internal gradient mesh */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-[60px]" />
                
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                  <span className="rounded-b-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#020817] shadow-lg shadow-emerald-500/20">
                    Most Popular
                  </span>
                </div>

                <div className="mb-8 mt-2">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    Pro <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </h2>
                  <p className="text-sm text-slate-400">
                    Unlock medium and hard pads — exactly like the screen.
                  </p>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-white">${monthlyPrice}</span>
                    <span className="text-slate-500 text-base font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-emerald-400/80 mt-2 font-medium">
                    {billing === 'annual' ? 'Billed annually ($120/yr)' : 'Billed monthly, cancel anytime'}
                  </p>
                </div>
                <ul className="space-y-4 mb-10 flex-1 relative z-10">
                  {PRO_FEATURES.map((f, i) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white font-medium">
                      <div className="rounded-full bg-emerald-500/20 p-1 mt-0.5 shrink-0">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className={i === 0 ? "text-slate-300" : "text-white"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleProCheckout}
                  disabled={loading}
                  className="relative w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 px-4 py-3.5 text-center text-sm font-bold text-[#020817] transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                >
                  {loading ? 'Opening secure checkout…' : 'Upgrade to Pro'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* ── Stats bar ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-24 rounded-2xl bg-white/[0.02] border border-white/5 py-10 px-6 backdrop-blur-sm"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-1">{s.value}</p>
                <p className="text-sm font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Everything included ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Everything included</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                One membership. The same pads and articles — not a separate video library glued on later.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Interview questions */}
              <div className="group rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all p-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-4">310+ QUESTIONS</p>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">Interview question bank for every data role</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  SQL, modeling, orchestration, warehouses, ML, and behavioral — original prompts, not a leaked exam dump. Drill mode is one question at a time.
                </p>
                <div className="space-y-3">
                  {[
                    { q: 'Deduplicate to the latest customer row. Why not filter the window in WHERE?', tag: 'HARD', sub: 'SQL · Stripe', c: 'orange' },
                    { q: 'Sessionize click events with a 30-minute inactivity gap.', tag: 'EASY', sub: 'SQL · Netflix', c: 'blue' },
                    { q: 'Write top-3 orders per country. What breaks if you use RANK() instead of ROW_NUMBER()?', tag: 'EASY', sub: 'SQL · Amazon', c: 'blue' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
                      <span className={`mt-0.5 rounded px-2 py-0.5 text-[9px] font-bold tracking-wider shrink-0 ${item.c === 'orange' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {item.tag}
                      </span>
                      <div>
                        <p className="text-slate-200 text-sm font-medium leading-snug mb-1">{item.q}</p>
                        <p className="text-slate-500 text-[11px] font-semibold">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coding problems */}
              <div className="group rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all p-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-4">60 CODING PROBLEMS</p>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">Write and run SQL and Python</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  3 easy pads stay free. 28 medium and 29 hard unlock with Pro. Tests run instantly right in your browser tab — no setup required.
                </p>
                <div className="rounded-xl bg-[#0d1117] border border-white/5 p-5 font-mono text-xs shadow-inner">
                  <div className="flex gap-1.5 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  </div>
                  <p className="text-slate-500 mb-2">-- Calculate Mean without Numpy</p>
                  <p><span className="text-[#ff7b72]">def</span> <span className="text-[#d2a8ff]">arithmetic_mean</span>(x):</p>
                  <p className="ml-4 text-[#a5d6ff]"><span className="text-[#ff7b72]">return</span> sum(x) / len(x)</p>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-emerald-400 font-sans">
                    <CheckCircle className="w-4 h-4" /> 
                    <span className="font-semibold">Tests passed successfully</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Free vs Pro comparison ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Compare features</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80">
                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest text-slate-400 w-1/3">Features</th>
                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest text-slate-400 w-1/3">Free</th>
                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest text-emerald-400 w-1/3">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-5 px-6 text-slate-200 font-semibold">{row.surface}</td>
                      <td className="py-5 px-6">
                        {row.freeLocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 font-medium text-xs">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">{row.free}</span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-emerald-300 font-semibold flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" /> {row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ── Curriculum Highlights ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Inside the Pro Curriculum</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Real-world data engineering scenarios covering the modern data stack.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Apache Kafka & Flink', desc: 'Event streaming, topic partitioning, watermarking, and exactly-once semantics.', icon: Waves, color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
                { title: 'dbt & Snowflake', desc: 'Data Vault, Star schemas, incremental materializations, and clustering keys.', icon: Snowflake, color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' },
                { title: 'Apache Airflow', desc: 'DAG optimization, custom operators, dynamic task mapping, and sensors.', icon: Wind, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
                { title: 'PySpark & Databricks', desc: 'Tuning joins, handling data skew, salting techniques, and Z-Order optimization.', icon: Zap, color: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
                { title: 'Vector DBs & RAG', desc: 'Pinecone, semantic search, chunking strategies, and LLM embeddings.', icon: Brain, color: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
                { title: 'System Design', desc: 'Designing 10TB/day log pipelines, CDC with Debezium, and Data Lakehouses.', icon: Server, color: 'bg-orange-500/10 border-orange-500/20 text-orange-300' },
                { title: 'Advanced SQL', desc: 'Recursive CTEs, Gaps & Islands, Sessionization, and complex Window Functions.', icon: BarChart3, color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
                { title: 'Python Optimization', desc: 'Vectorized Pandas, NumPy broadcasting, and multiprocessing data pipelines.', icon: Code2, color: 'bg-green-500/10 border-green-500/20 text-green-300' },
              ].map((stack, i) => {
                const IconComponent = stack.icon;
                return (
                  <div key={i} className={`rounded-xl border ${stack.color} p-5 hover:bg-white/5 transition-colors`}>
                    <div className="mb-3">
                      <IconComponent className="h-7 w-7" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">{stack.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{stack.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── FAQ ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24 max-w-3xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Frequently asked questions</h2>
              <p className="text-slate-400">
                Can't find what you need?{' '}
                <Link to="/contact" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors">
                  Email support
                </Link>
              </p>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/30 overflow-hidden transition-all hover:bg-slate-900/50">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none"
                  >
                    <span className="text-base font-semibold text-slate-200">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-500 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-emerald-400' : ''}`}
                    />
                  </button>
                  <motion.div 
                    initial={false}
                    animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1">
                      <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── CTA bottom ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-[#020817] border border-emerald-500/20 px-8 py-16 text-center shadow-[0_0_50px_-15px_rgba(16,185,129,0.2)]"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-emerald-500/10 blur-[80px] pointer-events-none" />
            <h2 className="relative z-10 text-3xl font-extrabold text-white mb-4">Ready to ace your onsite?</h2>
            <p className="relative z-10 text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Start with easy pads for free. Upgrade when you want the medium and hard set that matches a real interview.
            </p>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/coding"
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-sm font-bold text-white transition-all w-full sm:w-auto"
              >
                Try easy problems
              </Link>
              <button
                onClick={handleProCheckout}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 px-8 py-3.5 text-sm font-bold text-[#020817] transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/25 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {loading ? 'Opening checkout…' : 'Upgrade to Pro'}
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default UpgradeProPage;
