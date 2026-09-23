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
    color: '#94a3b8',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '6px',
    cursor: 'pointer',
    zIndex: '10',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
    lineHeight: '1.5',
    minHeight: '32px',
    minWidth: 'auto',
    ...extra,
  });
}

function bindCopy(button, code) {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    const previous = button.textContent;
    button.textContent = 'Copied';
    button.style.color = '#4ade80';
    setTimeout(() => {
      button.textContent = previous;
      button.style.color = '';
    }, 2000);
  });
}

/**
 * Injects Copy (and Run in playground for SQL) into every <pre> in an article.
 */
const useCopyCodeButtons = (dependency) => {
  useEffect(() => {
    if (!dependency) return;

    const timer = setTimeout(() => {
      const container = document.querySelector('.article-content');
      if (!container) return;

      container.querySelectorAll('pre').forEach((pre) => {
        if (pre.querySelector('.copy-code-btn')) return;
        const figure = pre.closest('.article-code');
        if (figure?.querySelector('.copy-code-btn')) return;

        const code = pre.querySelector('code')?.textContent || pre.textContent || '';
        const langClass = `${pre.className} ${pre.querySelector('code')?.className || ''}`;
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

        if (figure && !figure.querySelector('.wrap-code-btn')) {
          const wrap = document.createElement('button');
          wrap.type = 'button';
          wrap.className = 'wrap-code-btn compact-control';
          wrap.textContent = 'Wrap';
          wrap.setAttribute('aria-label', 'Toggle line wrap');
          wrap.addEventListener('click', () => {
            const on = figure.classList.toggle('is-wrap');
            wrap.textContent = on ? 'Scroll' : 'Wrap';
          });
          actions?.appendChild(wrap);
        }

        if (looksLikeSql(code, langClass)) {
          const run = document.createElement('a');
          run.className = 'run-sql-btn compact-control';
          run.textContent = 'Run';
          run.href = playgroundSqlHref(code);
          run.setAttribute('aria-label', 'Run this SQL in the playground');
          if (actions) {
            actions.appendChild(run);
          } else {
            styleChip(run, {
              right: '72px',
              color: '#93c5fd',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            });
            pre.appendChild(run);
          }
        }
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      const container = document.querySelector('.article-content');
      if (container) {
        container.querySelectorAll('.copy-code-btn, .run-sql-btn, .wrap-code-btn').forEach((el) => el.remove());
      }
    };
  }, [dependency]);
};

export default useCopyCodeButtons;
