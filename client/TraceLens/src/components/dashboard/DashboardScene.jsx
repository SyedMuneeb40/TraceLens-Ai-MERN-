import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Sparkles, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const investigatorModel = "/models/investigator.glb";

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function BugSignal({ reducedMotion }) {
  const signal = useRef(null);

  useFrame(({ clock }, delta) => {
    if (!signal.current || reducedMotion) return;
    signal.current.rotation.y += delta * 0.35;
    signal.current.position.y = 1.2 + Math.sin(clock.elapsedTime * 1.35) * 0.08;
  });

  return (
    <Float speed={reducedMotion ? 0 : 1.1} floatIntensity={reducedMotion ? 0 : 0.15}>
      <group ref={signal} position={[1.28, 1.2, 0.05]}>
        <mesh>
          <sphereGeometry args={[0.17, 16, 12]} />
          <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.018, 8, 24]} />
          <meshBasicMaterial color="#ffe477" />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.21, 0.02, 0]} rotation={[0, 0, side * 0.55]}>
            <capsuleGeometry args={[0.018, 0.22, 4, 8]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
          </mesh>
        ))}
        <Line points={[[0, 0.16, 0], [-0.08, 0.3, 0], [-0.02, 0.42, 0]]} color="#ffe477" lineWidth={1.3} />
        <Line points={[[0, 0.16, 0], [0.08, 0.3, 0], [0.02, 0.42, 0]]} color="#ffe477" lineWidth={1.3} />
        <pointLight color="#facc15" intensity={0.9} distance={1.7} />
      </group>
    </Float>
  );
}

function HumanInvestigator({ reducedMotion }) {
  const modelGroup = useRef(null);
  const headBone = useRef(null);
  const cursor = useRef({ x: 0, y: 0 });
  const { scene, animations } = useGLTF(investigatorModel);
  const { actions } = useAnimations(animations, modelGroup);

  useEffect(() => {
    const updateCursor = (event) => {
      const bounds = document.querySelector(".dashboard-scene canvas")?.getBoundingClientRect();
      if (!bounds) return;

      cursor.current.x = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
      cursor.current.y = THREE.MathUtils.clamp(-((event.clientY - bounds.top) / bounds.height) * 2 + 1, -1, 1);
    };

    window.addEventListener("pointermove", updateCursor);
    return () => window.removeEventListener("pointermove", updateCursor);
  }, []);

  useEffect(() => {
    let foundHead = null;
    scene.traverse((object) => {
      if (!foundHead && /head/i.test(object.name)) foundHead = object;
    });
    headBone.current = foundHead;
  }, [scene]);

  useEffect(() => {
    const idleAction = Object.entries(actions || {}).find(([name]) => /idle/i.test(name))?.[1]
      || Object.values(actions || {})[0];
    if (!idleAction) return undefined;

    idleAction.reset().fadeIn(0.35).play();
    return () => idleAction.fadeOut(0.25);
  }, [actions]);

  useFrame(({ pointer }, delta) => {
    if (!modelGroup.current) return;

    const pointerX = cursor.current.x || pointer.x;
    const pointerY = cursor.current.y || pointer.y;
    const targetY = reducedMotion ? 0 : THREE.MathUtils.clamp(pointerX * 0.58, -0.58, 0.58);
    const targetX = reducedMotion ? 0 : THREE.MathUtils.clamp(pointerY * -0.18, -0.18, 0.18);
    modelGroup.current.rotation.y = THREE.MathUtils.lerp(modelGroup.current.rotation.y, targetY, delta * 4.2);
    modelGroup.current.rotation.x = THREE.MathUtils.lerp(modelGroup.current.rotation.x, targetX, delta * 4.2);

    if (headBone.current) {
      headBone.current.rotation.y = THREE.MathUtils.lerp(headBone.current.rotation.y, targetY, delta * 3.5);
      headBone.current.rotation.x = THREE.MathUtils.lerp(headBone.current.rotation.x, targetX, delta * 3.5);
    }
  });

  return (
    <group position={[0, -0.82, 0]}>
      <group ref={modelGroup} scale={0.02}>
        <primitive object={scene} />
      </group>
      <BugSignal reducedMotion={reducedMotion} />
    </group>
  );
}

function DashboardScene() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="dashboard-scene" aria-label="Interactive 3D incident investigator illustration">
      <Canvas
        camera={{ position: [0, 0.15, 5.7], fov: 34 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        fallback={<div className="scene-fallback">Investigation model unavailable</div>}
      >
        <ambientLight intensity={0.72} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} color="#fff1c2" />
        <pointLight position={[-3, 0, 2]} intensity={2.2} color="#f59e0b" />
        <pointLight position={[2, 1, 1]} intensity={1.2} color="#facc15" />
        <Suspense fallback={null}>
          <HumanInvestigator reducedMotion={reducedMotion} />
        </Suspense>
        <Sparkles count={45} scale={[4.6, 3.8, 2.8]} size={1.6} speed={reducedMotion ? 0 : 0.24} color="#ffe477" />
      </Canvas>
      <div className="dashboard-scene-grid" />
      <div className="dashboard-scene-caption">
        <span className="status-dot" />
        Cursor-aware incident watch
      </div>
    </div>
  );
}

useGLTF.preload(investigatorModel);

export default DashboardScene;
