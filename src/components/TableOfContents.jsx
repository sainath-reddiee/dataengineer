import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
      level: parseInt(match[1], 10),
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

function stageLabel(index) {
  return String(index + 1).padStart(2, '0');
}

const TableOfContents = ({ headings = [], placement = 'both' }) => {
  const [activeId, setActiveId] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [marker, setMarker] = useState(null);
  const listRef = useRef(null);
  const markerReady = useRef(false);
  const sections = useMemo(
    () => headings.filter((heading) => heading.level === 2),
    [headings]
  );

  useEffect(() => {
    if (sections.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  useLayoutEffect(() => {
    if (placement === 'strip') return undefined;
    const list = listRef.current;
    if (!list || !activeId) return undefined;
    const link = list.querySelector(`[data-toc-id="${CSS.escape(activeId)}"]`);
    if (!link) return undefined;
    const top = link.offsetTop + Math.max(0, (link.offsetHeight - 7) / 2);
    setMarker({ top, animate: markerReady.current });
    markerReady.current = true;

    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 80rem)').matches) {
      return undefined;
    }
    const nav = list.closest('nav');
    if (!nav || nav.clientHeight < 40) return undefined;
    const navBox = nav.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    if (linkBox.top < navBox.top) {
      nav.scrollBy({ top: linkBox.top - navBox.top - 8, behavior: 'auto' });
    } else if (linkBox.bottom > navBox.bottom) {
      nav.scrollBy({ top: linkBox.bottom - navBox.bottom + 8, behavior: 'auto' });
    }
    return undefined;
  }, [activeId, sections, placement]);

  if (sections.length < 3) return null;

  const jumpToHeading = (event, id, closeMobile = false) => {
    event.preventDefault();
    if (closeMobile) setIsCollapsed(true);
    const target = document.getElementById(id);
    if (target) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const showRail = placement === 'rail' || placement === 'both';
  const showStrip = placement === 'strip' || placement === 'both';

  return (
    <>
      {showRail && (
        <nav
          aria-label="Table of contents"
          className="article-toc-rail sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
        >
          <p className="article-toc-kicker">On this page</p>
          <div className="article-toc-track">
            {marker && (
              <span
                className={`article-toc-marker${marker.animate ? ' is-set' : ''}`}
                style={{ top: marker.top }}
                aria-hidden="true"
              />
            )}
            <ul ref={listRef} className="article-toc-list">
            {sections.map(({ id, text }, index) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  data-toc-id={id}
                  title={text}
                  aria-current={activeId === id ? 'location' : undefined}
                  onClick={(event) => jumpToHeading(event, id, false)}
                  className={activeId === id ? 'is-active' : undefined}
                >
                  <span className="article-toc-index">{stageLabel(index)}</span>
                  <span className="article-toc-label">{text}</span>
                </a>
              </li>
            ))}
            </ul>
          </div>
        </nav>
      )}

      {showStrip && (
        <nav aria-label="Table of contents" className="article-toc-strip">
          <button
            type="button"
            aria-expanded={!isCollapsed}
            aria-controls="mobile-toc-list"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="article-toc-strip-toggle"
          >
            <span className="article-toc-strip-label">
              <List className="h-4 w-4 text-rust-500" aria-hidden="true" />
              On this page · {sections.length} sections
            </span>
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          {!isCollapsed && (
            <ul id="mobile-toc-list" className="article-toc-strip-list">
              {sections.map(({ id, text }, index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(event) => jumpToHeading(event, id, true)}
                    className={activeId === id ? 'is-active' : undefined}
                  >
                    <span className="article-toc-index">{stageLabel(index)}</span>
                    <span className="article-toc-label">{text}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}
    </>
  );
};

export default TableOfContents;
