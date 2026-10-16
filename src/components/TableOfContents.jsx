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
        <div className="border-l border-paper-500 pl-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
            On this page
          </p>
          <ul className="space-y-1">
            {headings.map(({ id, text, level }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`-ml-[17px] block border-l-2 py-1.5 pl-[15px] text-[14px] leading-snug transition-colors ${
                    level === 3 ? 'pl-7' : ''
                  } ${
                    activeId === id
                      ? 'border-rust-500 text-ink'
                      : 'border-transparent text-ink-faint hover:text-ink'
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
          className="flex w-full items-center justify-between border-y border-paper-500 py-3 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <span className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.06em]">
            <List className="h-4 w-4 text-rust-500" />
            On this page · {headings.length} sections
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
              <ul className="space-y-1 border-b border-paper-500 py-3">
                {headings.map(({ id, text, level }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsCollapsed(true);
                        // Delay scroll until after collapse animation completes,
                        // otherwise layout reflow cancels the smooth scroll
                        setTimeout(() => {
                          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 350);
                      }}
                      className={`block py-1.5 text-[15px] text-ink-muted transition-colors hover:text-rust-600 ${
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
