import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Extracts h2 and h3 headings from HTML content string.
 */
export function extractHeadings(html) {
  if (!html) return [];
  const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
  const headings = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]*>/g, '').trim(),
    });
  }
  return headings;
}

/**
 * Injects id attributes into h2 and h3 tags in HTML content.
 */
export function injectHeadingIds(html) {
  if (!html) return html;
  let counter = 0;
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (match, level, attrs, content) => {
    if (/id="/.test(attrs)) return match;
    const text = content.replace(/<[^>]*>/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60) || `heading-${counter}`;
    counter++;
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
}

const TableOfContents = ({ headings = [] }) => {
  const [activeId, setActiveId] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <>
      {/* Desktop: Sticky sidebar */}
      <nav aria-label="Table of contents" className="hidden xl:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <List className="w-4 h-4" />
            On This Page
          </h2>
          <ul className="space-y-1">
            {headings.map(({ id, text, level }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`block text-sm py-1.5 transition-colors leading-snug ${
                    level === 3 ? 'pl-4' : 'pl-0'
                  } ${
                    activeId === id
                      ? 'text-blue-400 font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile: Collapsible */}
      <div className="xl:hidden mb-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2 font-semibold">
            <List className="w-4 h-4 text-blue-400" />
            Table of Contents ({headings.length})
          </span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul className="mt-2 px-4 py-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1">
                {headings.map(({ id, text, level }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setIsCollapsed(true);
                      }}
                      className={`block text-sm py-1.5 text-gray-400 hover:text-blue-400 transition-colors ${
                        level === 3 ? 'pl-4' : 'pl-0'
                      }`}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default TableOfContents;
