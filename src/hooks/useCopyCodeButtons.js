// src/hooks/useCopyCodeButtons.js
import { useEffect } from 'react';
import { looksLikeSql, playgroundSqlHref } from '@/utils/looksLikeSql';

function styleChip(el, extra = {}) {
  Object.assign(el.style, {
    position: 'absolute',
    top: '8px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#DCD5C8',
    backgroundColor: '#2E2B26',
    border: '1px solid #4A453D',
    borderRadius: '4px',
    cursor: 'pointer',
    zIndex: '10',
    transition: 'all 0.15s ease',
    lineHeight: '1.4',
    minHeight: '28px',
    minWidth: 'auto',
    ...extra,
  });
}

function fallbackCopy(code) {
  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function codeFromBlock(pre, figure) {
  const sources = figure?.querySelectorAll('.article-code-src');
  if (sources && sources.length) {
    return [...sources].map((node) => node.textContent.replace(/\u00a0/g, ' ')).join('\n');
  }
  return pre.querySelector('code')?.textContent || pre.textContent || '';
}

function bindCopy(button, code) {
  button.addEventListener('click', async () => {
    const previous = button.textContent;
    button.textContent = 'Copied';
    button.classList.add('is-copied');
    try {
      if (navigator.clipboard?.writeText) {
        await Promise.race([
          navigator.clipboard.writeText(code),
          new Promise((_, reject) => setTimeout(() => reject(new Error('clipboard timeout')), 600)),
        ]);
      } else {
        fallbackCopy(code);
      }
    } catch {
      try {
        fallbackCopy(code);
      } catch {
        button.textContent = previous;
        button.classList.remove('is-copied');
        return;
      }
    }
    setTimeout(() => {
      button.textContent = previous;
      button.classList.remove('is-copied');
    }, 2000);
  });
}

/**
 * Injects Copy / Wrap / Run into every article code block.
 */
const useCopyCodeButtons = (dependency) => {
  useEffect(() => {
    if (!dependency) return undefined;

    const rafId = window.requestAnimationFrame(() => {
      const container = document.querySelector('.article-content');
      if (!container) return;

      container.querySelectorAll('pre').forEach((pre) => {
        if (pre.querySelector('.copy-code-btn')) return;
        const figure = pre.closest('.article-code');
        if (figure?.querySelector('.copy-code-btn')) return;

        const code = codeFromBlock(pre, figure);
        const langClass = `${pre.className} ${pre.querySelector('code')?.className || ''} ${figure?.getAttribute('data-lang') || ''}`;
        const actions = figure?.querySelector('.article-code-actions');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-code-btn compact-control';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        bindCopy(button, code);

        if (actions) {
          actions.appendChild(button);
        } else {
          pre.style.position = 'relative';
          styleChip(button, { right: '8px' });
          pre.appendChild(button);
        }

        if (figure && actions && !figure.querySelector('.wrap-code-btn')) {
          const wrap = document.createElement('button');
          wrap.type = 'button';
          wrap.className = 'wrap-code-btn compact-control';
          wrap.textContent = 'Wrap';
          wrap.setAttribute('aria-label', 'Toggle line wrap');
          wrap.setAttribute('aria-pressed', 'false');
          wrap.addEventListener('click', () => {
            const on = figure.classList.toggle('is-wrap');
            wrap.textContent = on ? 'Scroll' : 'Wrap';
            wrap.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          actions.appendChild(wrap);
        }

        const expand = figure?.querySelector('.article-code-expand');
        if (expand && !expand.dataset.bound) {
          expand.dataset.bound = '1';
          expand.addEventListener('click', () => {
            const on = figure.classList.toggle('is-expanded');
            const total = figure.getAttribute('data-lines') || '';
            expand.textContent = on ? 'Collapse code' : `Show all ${total} lines`;
          });
        }

        if (looksLikeSql(code, langClass)) {
          const run = document.createElement('a');
          run.className = 'run-sql-btn compact-control';
          run.textContent = 'Run SQL';
          run.href = playgroundSqlHref(code);
          run.setAttribute('aria-label', 'Run this SQL query in the browser SQL playground');
          if (actions) {
            actions.appendChild(run);
          } else {
            styleChip(run, {
              right: '72px',
              color: '#F0C6B2',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            });
            pre.appendChild(run);
          }
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      const container = document.querySelector('.article-content');
      if (container) {
        container.querySelectorAll('.copy-code-btn, .run-sql-btn, .wrap-code-btn').forEach((el) => el.remove());
      }
    };
  }, [dependency]);
};

export default useCopyCodeButtons;
