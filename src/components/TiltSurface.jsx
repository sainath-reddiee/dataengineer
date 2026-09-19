import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const TiltSurface = ({
  children,
  className = '',
  disabled = false,
  intensity = 10,
}) => {
  const [quiet, setQuiet] = useState(true);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 220,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 220,
    damping: 22,
  });
  const glareX = useTransform(x, [-0.5, 0.5], ['8%', '92%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['8%', '92%']);

  useEffect(() => {
    setQuiet(
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const off = disabled || quiet;

  const onMove = (event) => {
    if (off) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / (rect.width || 1) - 0.5);
    y.set((event.clientY - rect.top) / (rect.height || 1) - 0.5);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={off ? undefined : { rotateX, rotateY, transformPerspective: 1100 }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
      {!off && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/30 blur-2xl"
          style={{ left: glareX, top: glareY }}
        />
      )}
    </motion.div>
  );
};

export default TiltSurface;
