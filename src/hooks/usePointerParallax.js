import { useEffect } from 'react';

const setVar = (name, value) => {
  document.documentElement.style.setProperty(name, value);
};

export default function usePointerParallax() {
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduced) return undefined;

    let frame = 0;
    const onMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth;
        const y = event.clientY / window.innerHeight;
        setVar('--px', ((x - 0.5) * 2).toFixed(3));
        setVar('--py', ((y - 0.5) * 2).toFixed(3));
        setVar('--spot-x', `${Math.round(event.clientX)}px`);
        setVar('--spot-y', `${Math.round(event.clientY)}px`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
}
