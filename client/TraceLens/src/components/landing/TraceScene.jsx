import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const nodes = [
  { position: [-1.45, 0.65, 0.1], color: "#facc15", label: "LOGS" },
  { position: [1.35, 0.6, -0.15], color: "#ffe477", label: "AI" },
  { position: [1.4, -0.8, 0.2], color: "#fef08a", label: "EVIDENCE" },
  { position: [-1.35, -0.85, -0.2], color: "#f59e0b", label: "ALERT" }
];

function InvestigationCore({ reducedMotion }) {
  const core = useRef(null);

  useFrame(({ clock }, delta) => {
    if (!core.current || reducedMotion) return;

    core.current.rotation.x += delta * 0.16;
    core.current.rotation.y += delta * 0.25;
    core.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.4) * 0.035);
  });

  return (
    <group ref={core}>
      <mesh>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#a16207"
          emissiveIntensity={0.8}
          metalness={0.55}
          roughness={0.24}
          transparent
          opacity={0.82}
        />
      </mesh>
      <mesh scale={1.08}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshBasicMaterial
          color="#fff3a3"
          transparent
          opacity={0.26}
          wireframe
        />
      </mesh>
      <pointLight color="#facc15" intensity={2.2} distance={4} />
    </group>
  );
}

function DataNode({ color, position, reducedMotion }) {
  const node = useRef(null);

  useFrame((_, delta) => {
    if (!node.current || reducedMotion) return;

    node.current.rotation.y += delta * 0.45;
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.25}
      rotationIntensity={reducedMotion ? 0 : 0.18}
      floatIntensity={reducedMotion ? 0 : 0.3}
    >
      <group ref={node} position={position}>
        <mesh>
          <octahedronGeometry args={[0.2, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            metalness={0.45}
            roughness={0.2}
          />
        </mesh>
        <mesh scale={1.45}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
        <pointLight color={color} intensity={0.7} distance={1.5} />
      </group>
    </Float>
  );
}

function OrbitalRing({ color, rotation, speed, reducedMotion }) {
  const ring = useRef(null);

  useFrame((_, delta) => {
    if (!ring.current || reducedMotion) return;
    ring.current.rotation.z += delta * speed;
  });

  return (
    <mesh ref={ring} rotation={rotation}>
      <torusGeometry args={[1.48, 0.008, 12, 96]} />
      <meshBasicMaterial color={color} transparent opacity={0.42} />
    </mesh>
  );
}

function InvestigationNetwork({ reducedMotion }) {
  const network = useRef(null);

  useFrame(({ pointer }, delta) => {
    if (!network.current) return;

    const targetX = reducedMotion ? 0 : pointer.y * 0.08;
    const targetY = reducedMotion ? 0 : pointer.x * 0.12;

    network.current.rotation.x = THREE.MathUtils.lerp(
      network.current.rotation.x,
      targetX,
      delta * 2.5
    );
    network.current.rotation.y = THREE.MathUtils.lerp(
      network.current.rotation.y,
      targetY,
      delta * 2.5
    );
  });

  return (
    <group ref={network}>
      <InvestigationCore reducedMotion={reducedMotion} />
      <OrbitalRing color="#facc15" rotation={[0.4, 0.2, 0]} speed={0.14} reducedMotion={reducedMotion} />
      <OrbitalRing color="#f59e0b" rotation={[-0.55, 0.3, 1.2]} speed={-0.18} reducedMotion={reducedMotion} />

      {nodes.map((node) => (
        <DataNode key={node.label} {...node} reducedMotion={reducedMotion} />
      ))}

      {nodes.map((node) => (
        <Line
          key={`${node.label}-connection`}
          points={[[0, 0, 0], node.position]}
          color={node.color}
          transparent
          opacity={0.42}
          lineWidth={1}
        />
      ))}

      <Line
        points={[
          nodes[0].position,
          nodes[1].position,
          nodes[2].position,
          nodes[3].position,
          nodes[0].position
        ]}
        color="#b8a96a"
        transparent
        opacity={0.2}
        lineWidth={0.75}
      />
    </group>
  );
}

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

function TraceScene() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="trace-scene" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 39 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        fallback={<div className="scene-fallback">Trace intelligence online</div>}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 3, 4]} intensity={1.5} color="#dbeafe" />
        <pointLight position={[-3, -2, 2]} intensity={1.8} color="#f59e0b" />
        <InvestigationNetwork reducedMotion={reducedMotion} />
        <Sparkles
          count={55}
          scale={[5, 3.5, 3]}
          size={1.5}
          speed={reducedMotion ? 0 : 0.25}
          color="#ffe477"
        />
      </Canvas>
      <div className="scene-grid" />
      <div className="scene-status">
        <span className="scene-status-dot" />
        Live investigation map
      </div>
    </div>
  );
}

export default TraceScene;
