import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Cube = ({ className = '', delay = 0, size = 44 }) => (
  <div
    className={`prim-cube ${className}`}
    style={{
      '--cube': `${size}px`,
      animationDelay: `${delay}s`,
    }}
  >
    <span className="prim-face prim-face-f" />
    <span className="prim-face prim-face-b" />
    <span className="prim-face prim-face-l" />
    <span className="prim-face prim-face-r" />
    <span className="prim-face prim-face-t" />
    <span className="prim-face prim-face-bt" />
  </div>
);

const HeroStage = ({ children, reduceMotion = false }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 });

  const onMove = (event) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / (rect.width || 1) - 0.5);
    y.set((event.clientY - rect.top) / (rect.height || 1) - 0.5);
  };

  return (
    <motion.div
      className="hero-stage relative"
      style={reduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 1400 }}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {!reduceMotion && (
        <div className="hero-stage-objects" aria-hidden="true">
          <div className="prim-sphere prim-pos-sphere" />
          <div className="prim-ring prim-pos-ring" />
          <div className="prim-ring prim-ring-sm prim-pos-ring-2" />
          <div className="prim-pos-cube-a">
            <Cube size={42} delay={0} />
          </div>
          <div className="prim-pos-cube-b">
            <Cube size={28} delay={1.4} />
          </div>
          <div className="prim-pos-cube-c">
            <Cube size={22} delay={0.7} />
          </div>
          <div className="prim-db prim-pos-db">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default HeroStage;
