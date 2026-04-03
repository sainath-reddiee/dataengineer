// src/hooks/useCopyCodeButtons.js
import { useEffect } from 'react';

/**
 * Injects a "Copy" button into every <pre> block within a container.
 * Call this hook with a dependency that changes when article content renders.
 */
const useCopyCodeButtons = (dependency) => {
  useEffect(() => {
    if (!dependency) return;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const container = document.querySelector('.article-content');
      if (!container) return;

      const preBlocks = container.querySelectorAll('pre');

      preBlocks.forEach((pre) => {
        // Skip if already has a copy button
        if (pre.querySelector('.copy-code-btn')) return;

        // Make the pre block a positioning context
        pre.style.position = 'relative';

        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');

        // Styling
        Object.assign(button.style, {
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '4px 12px',
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
          lineHeight: '1.5'
        });

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
          const code = pre.querySelector('code')?.textContent || pre.textContent;
          try {
            await navigator.clipboard.writeText(code);
          } catch {
            // Fallback
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
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [dependency]);
};

export default useCopyCodeButtons;
