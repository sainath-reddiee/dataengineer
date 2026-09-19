import { useEffect, useRef } from 'react';

const ParticleField = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduced) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const particles = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      s: 0.4 + Math.random() * 1.4,
    }));

    let frame = 0;
    let running = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const px = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--px')) || 0;
      const py = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--py')) || 0;

      for (const p of particles) {
        p.y -= 0.00035 * p.s;
        if (p.y < -0.04) p.y = 1.04;
        const x = (p.x + px * 0.04 * p.z) * width;
        const y = (p.y + py * 0.03 * p.z) * height;
        const r = p.s * (0.7 + p.z * 1.6);
        ctx.beginPath();
        ctx.fillStyle = p.z > 0.5
          ? `rgba(232, 184, 109, ${0.16 + p.z * 0.4})`
          : `rgba(45, 212, 191, ${0.14 + p.z * 0.38})`;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    frame = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />;
};

export default ParticleField;
