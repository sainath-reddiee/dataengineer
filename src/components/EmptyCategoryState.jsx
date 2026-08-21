// src/components/EmptyCategoryState.jsx
// Shown when a known category has no published posts yet.
// Must not read as "under construction" / "coming soon" (AdSense low-value flag).
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ── tiny floating particle ────────────────────────────────────────────────────
const Particle = ({ delay, x, y, size, color, duration }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      top: `${y}%`,
      background: color,
      filter: 'blur(1px)',
    }}
    animate={{
      y: [0, -18, 0],
      opacity: [0.2, 0.8, 0.2],
      scale: [1, 1.3, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// ── orbiting dot ─────────────────────────────────────────────────────────────
const OrbitDot = ({ radius, speed, dotColor, size = 6, startAngle = 0 }) => (
  <motion.div
    className="absolute top-1/2 left-1/2 pointer-events-none"
    style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
    animate={{ rotate: 360 }}
    transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
  >
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        background: dotColor,
        boxShadow: `0 0 8px 2px ${dotColor}`,
      }}
    />
  </motion.div>
);

// ── main component ────────────────────────────────────────────────────────────
const EmptyCategoryState = ({ category, title }) => {
  const particles = React.useMemo(() => {
    const colors = [
      'rgba(96,165,250,0.7)',   // blue-400
      'rgba(167,139,250,0.7)', // violet-400
      'rgba(52,211,153,0.6)',  // emerald-400
      'rgba(251,191,36,0.5)',  // amber-400
      'rgba(248,113,113,0.5)',  // red-400
    ];
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      color: colors[i % colors.length],
      delay: Math.random() * 3,
      duration: 2.5 + Math.random() * 3,
    }));
  }, []);

  const label = category
    ? `${category.charAt(0).toUpperCase() + category.slice(1)} articles`
    : title || 'articles';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-blue-500/20
                 bg-gradient-to-br from-slate-900 via-blue-950/30 to-purple-950/30
                 p-10 md:p-16 text-center select-none"
      style={{ minHeight: 380 }}
    >
      {/* ── background particles ── */}
      {particles.map(p => (
        <Particle key={p.id} {...p} />
      ))}

      {/* ── glowing blobs ── */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full
                      bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 rounded-full
                      bg-purple-600/10 blur-3xl" />

      {/* ── central illustration ── */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Telescope / rocket illustration ring */}
        <div className="relative mb-8" style={{ width: 140, height: 140 }}>
          {/* outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* orbit rings */}
          <div className="absolute inset-0 rounded-full border border-blue-400/20" />
          <div className="absolute inset-3 rounded-full border border-purple-400/15" />

          {/* orbiting dots */}
          <OrbitDot radius={68} speed={4}   dotColor="rgba(96,165,250,0.9)"  size={7}  />
          <OrbitDot radius={55} speed={6.5} dotColor="rgba(167,139,250,0.9)" size={5}  />
          <OrbitDot radius={42} speed={3.2} dotColor="rgba(52,211,153,0.9)"  size={4}  />

          {/* center icon — animated telescope SVG */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg
              width="72" height="72" viewBox="0 0 72 72" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* telescope barrel */}
              <motion.rect
                x="8" y="30" width="38" height="12" rx="6"
                fill="url(#barrelGrad)"
                animate={{ scaleX: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* eyepiece */}
              <rect x="46" y="27" width="18" height="18" rx="9"
                fill="url(#eyeGrad)" />
              {/* tripod legs */}
              <line x1="20" y1="42" x2="10" y2="64" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="30" y1="42" x2="36" y2="64" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
              {/* stars */}
              {[
                { cx: 58, cy: 12, r: 2.5 },
                { cx: 48, cy: 8,  r: 1.5 },
                { cx: 65, cy: 22, r: 1.8 },
                { cx: 10, cy: 18, r: 1.5 },
                { cx: 4,  cy: 28, r: 1.2 },
              ].map((s, i) => (
                <motion.circle
                  key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#a78bfa"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
              <defs>
                <linearGradient id="barrelGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
                <radialGradient id="eyeGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>
        </div>

        {/* ── heading ── */}
        <motion.h3
          className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Nothing in this listing yet
        </motion.h3>

        {/* ── sub-heading ── */}
        <motion.p
          className="text-base md:text-lg text-blue-200/80 max-w-md leading-relaxed mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          This {label} listing has no published tutorials. Use the article library
          or another topic hub instead of waiting on an empty page.
        </motion.p>

        {/* ── animated ellipsis ── */}
        <motion.div
          className="flex items-center justify-center space-x-1 mt-1 mb-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="inline-block w-2 h-2 rounded-full bg-blue-400"
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>

        {/* ── pill badges ── */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {['🔬 Deep Dives', '⚡ Quick Guides', '💡 Best Practices', '🛠️ Hands-on Labs'].map(tag => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-medium
                         bg-blue-500/15 border border-blue-400/25 text-blue-300"
            >
              {tag}
            </span>
          ))}
        </motion.div>

        {/* ── CTA buttons ── */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to="/articles"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full
                       bg-gradient-to-r from-blue-600 to-purple-600
                       hover:from-blue-500 hover:to-purple-500
                       text-white text-sm font-semibold transition-all duration-300
                       shadow-lg shadow-blue-700/30 hover:shadow-blue-500/40
                       hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0l-4-4m4 4l-4 4" />
            </svg>
            Explore All Articles
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full
                       border border-blue-400/40 text-blue-300 text-sm font-medium
                       hover:bg-blue-500/15 transition-all duration-300
                       hover:-translate-y-0.5"
          >
            ← Back to Home
          </Link>
        </motion.div>

        {/* ── progress bar ── */}
        <motion.div
          className="mt-10 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Empty listing</span>
            <span>Browse the library</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: ['0%', '65%', '55%', '70%'] }}
              transition={{ duration: 3, delay: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmptyCategoryState;
