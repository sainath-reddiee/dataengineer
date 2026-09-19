const SceneBackground = () => (
  <div className="scene-bg" aria-hidden="true">
    <div className="scene-aurora" />
    <div className="scene-mesh" />
    <div className="scene-grid" />
    <div className="scene-orb-shift scene-orb-shift-a">
      <div className="scene-orb scene-orb-a" />
    </div>
    <div className="scene-orb-shift scene-orb-shift-b">
      <div className="scene-orb scene-orb-b" />
    </div>
    <div className="scene-orb-shift scene-orb-shift-c">
      <div className="scene-orb scene-orb-c" />
    </div>
    <div className="pointer-spot" />
    <div className="mag-cursor" />
    <div className="mag-cursor-dot" />
    <div className="scene-grain" />
  </div>
);

export default SceneBackground;
