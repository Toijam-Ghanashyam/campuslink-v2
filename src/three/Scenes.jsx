import * as THREE from 'three';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Edges, Html, PerformanceMonitor } from '@react-three/drei';
import { threadCurve } from './thread.js';
import { useThemeTokens, sceneColors } from '../theme/useThemeTokens.js';
import { tokens } from '../theme/tokens.js';

export function Thread({ colors, radius = 0.045 }) {
  const geo = useMemo(() => {
    const g = new THREE.TubeGeometry(threadCurve, 300, radius, 8, false);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    const a = new THREE.Color(colors.a);
    const b = new THREE.Color(colors.b);
    const tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      tmp.copy(a).lerp(b, i / n);
      arr.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [radius, colors.a, colors.b]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors toneMapped={false} />
    </mesh>
  );
}

export function Dust({ count = 320, color, additive }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 18;
      a[i * 3 + 1] = (Math.random() - 0.5) * 9;
      a[i * 3 + 2] = -Math.random() * 12;
    }
    return a;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01;
  });
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.035}
        sizeAttenuation
        depthWrite={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </Points>
  );
}

function PointerParallax({ children, amount = 0.12 }) {
  const ref = useRef();
  useFrame(({ pointer }, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, pointer.x * amount, 4, dt);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -pointer.y * amount * 0.6, 4, dt);
  });
  return <group ref={ref}>{children}</group>;
}

const _p = new THREE.Vector3();
const _l = new THREE.Vector3();
const _t = new THREE.Vector3();
const _off = new THREE.Vector3(0, 0.35, 1.4);

export function CameraRig({ progress }) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    const val = typeof progress?.get === 'function' ? progress.get() : (progress || 0);
    const t = THREE.MathUtils.clamp(val, 0, 0.97);
    threadCurve.getPointAt(t, _p);
    threadCurve.getPointAt(Math.min(t + 0.03, 1), _l);
    _t.copy(_p).add(_off);
    camera.position.lerp(_t, 1 - Math.exp(-6 * dt));
    camera.lookAt(_l);
  });
  return null;
}

export function Nodes({ labels, colors }) {
  return labels.map((label, i) => {
    const pos = threadCurve.getPointAt((i + 0.5) / labels.length);
    return (
      <group key={label} position={pos}>
        <mesh>
          <torusGeometry args={[0.28, 0.014, 12, 48]} />
          <meshBasicMaterial color={colors.a} toneMapped={false} />
        </mesh>
        <Html center distanceFactor={7} style={{ pointerEvents: 'none' }}>
          <span className="three-label">
            {String(i + 1).padStart(2, '0')} {label}
          </span>
        </Html>
      </group>
    );
  });
}

export function Layers({ spread, labels, colors }) {
  const refs = useRef([]);
  useFrame(() => {
    const s = typeof spread?.get === 'function' ? spread.get() : (spread || 0);
    refs.current.forEach((m, i) => {
      if (m) m.position.y = (i - (labels.length - 1) / 2) * (0.18 + s * 0.9);
    });
  });
  return labels.map((label, i) => (
    <mesh key={label} ref={(el) => (refs.current[i] = el)}>
      <boxGeometry args={[4, 0.08, 2.6]} />
      <meshBasicMaterial transparent opacity={0.14} color={colors.a} depthWrite={false} />
      <Edges color={colors.edge} />
      <Html position={[2.3, 0, 0]} style={{ pointerEvents: 'none' }}>
        <span className="three-label">{label}</span>
      </Html>
    </mesh>
  ));
}

export function Packets({ count = 8, height = 2.2, color }) {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (m) m.position.y = height / 2 - (((t * 0.35 + i / count) % 1) * height);
    });
  });
  return Array.from({ length: count }, (_, i) => (
    <mesh
      key={i}
      ref={(el) => (refs.current[i] = el)}
      position={[((i % 4) - 1.5) * 0.7, 0, ((i % 3) - 1) * 0.6]}
    >
      <sphereGeometry args={[0.05, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  ));
}

export function SceneCanvas({ visible, children, camera }) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, dpr]}
      camera={camera}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      {children}
    </Canvas>
  );
}

export function HeroScene() {
  const colors = sceneColors(useThemeTokens());
  return (
    <PointerParallax>
      <Thread colors={colors} radius={0.05} />
      <Dust color={colors.dust} additive={colors.additive} />
    </PointerParallax>
  );
}

export function PipelineScene({ progress, labels }) {
  const colors = sceneColors(useThemeTokens());
  return (
    <>
      <Thread colors={colors} />
      <Dust color={colors.dust} additive={colors.additive} />
      <Nodes labels={labels} colors={colors} />
      <CameraRig progress={progress} />
    </>
  );
}

export function LayersScene({ spread, labels }) {
  const colors = sceneColors(tokens.night);
  return (
    <PointerParallax amount={0.18}>
      <Layers spread={spread} labels={labels} colors={colors} />
      <Packets color={colors.b} />
      <Dust count={140} color={colors.dust} additive={colors.additive} />
    </PointerParallax>
  );
}

