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

        pre.style.position = 'relative';
        const code = pre.querySelector('code')?.textContent || pre.textContent || '';
        const langClass = `${pre.className} ${pre.querySelector('code')?.className || ''}`;

        const button = document.createElement('button');
        button.className = 'copy-code-btn compact-control';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        styleChip(button, { right: '8px' });

        button.addEventListener('mouseenter', () => {
          button.style.color = '#e2e8f0';
          button.style.backgroundColor = 'rgba(51, 65, 85, 0.9)';
          button.style.borderColor = 'rgba(100, 116, 139, 0.6)';
        });

        button.addEventListener('mouseleave', () => {
          if (button.textContent !== 'Copied!') {
            button.style.color = '#94a3b8';
            button.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
            button.style.borderColor = 'rgba(71, 85, 105, 0.5)';
          }
        });

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

          button.textContent = 'Copied!';
          button.style.color = '#4ade80';
          button.style.borderColor = 'rgba(74, 222, 128, 0.4)';

          setTimeout(() => {
            button.textContent = 'Copy';
            button.style.color = '#94a3b8';
            button.style.borderColor = 'rgba(71, 85, 105, 0.5)';
            button.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
          }, 2000);
        });

        pre.appendChild(button);

        if (looksLikeSql(code, langClass)) {
          const run = document.createElement('a');
          run.className = 'run-sql-btn compact-control';
          run.textContent = 'Run';
          run.href = playgroundSqlHref(code);
          run.setAttribute('aria-label', 'Run this SQL in the playground');
          styleChip(run, {
            right: '72px',
            color: '#93c5fd',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          });
          pre.appendChild(run);
        }
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      const container = document.querySelector('.article-content');
      if (container) {
        container.querySelectorAll('.copy-code-btn, .run-sql-btn').forEach((el) => el.remove());
      }
    };
  }, [dependency]);
};

export default useCopyCodeButtons;
