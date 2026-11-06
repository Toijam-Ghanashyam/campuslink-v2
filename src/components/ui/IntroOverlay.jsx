import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Inset a convex 2D polygon by `insetDist` pixels and build a rounded THREE.Shape
function createRoundedPolygonShape(pts, insetDist, cornerRadius) {
  const n = pts.length;
  // Compute centroid
  let cx = 0, cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= n;
  cy /= n;

  // Inset vertices toward centroid
  const insetPts = pts.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const shrink = Math.min(insetDist, len * 0.35);
    return {
      x: p.x - (dx / len) * shrink,
      y: p.y - (dy / len) * shrink,
    };
  });

  const shape = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const prev = insetPts[(i - 1 + n) % n];
    const curr = insetPts[i];
    const next = insetPts[(i + 1) % n];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const l1 = Math.hypot(v1x, v1y) || 1;
    const l2 = Math.hypot(v2x, v2y) || 1;
    const r = Math.min(cornerRadius, l1 * 0.32, l2 * 0.32);

    const pStart = { x: curr.x + (v1x / l1) * r, y: curr.y + (v1y / l1) * r };
    const pEnd = { x: curr.x + (v2x / l2) * r, y: curr.y + (v2y / l2) * r };

    if (i === 0) {
      shape.moveTo(pStart.x, pStart.y);
    } else {
      shape.lineTo(pStart.x, pStart.y);
    }
    shape.quadraticCurveTo(curr.x, curr.y, pEnd.x, pEnd.y);
  }
  shape.closePath();
  return { shape, centroid: { x: cx, y: cy } };
}

export function IntroOverlay() {
  const [show, setShow] = useState(true);
  const [shattering, setShattering] = useState(false);
  const mountRef = useRef(null);
  const shatterTriggerRef = useRef(null);

  const handleShatter = useCallback((clientX, clientY) => {
    if (shatterTriggerRef.current) {
      shatterTriggerRef.current(clientX, clientY);
    }
  }, []);

  useEffect(() => {
    const reduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setShow(false);
      return;
    }

    const container = mountRef.current;
    if (!container || !show) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene, Camera (1 world unit = 1 CSS pixel at z=0), Renderer
    const scene = new THREE.Scene();
    const fov = 30;
    const calcCameraZ = (h) => h / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    const camera = new THREE.PerspectiveCamera(fov, width / height, 10, 6000);
    camera.position.set(0, 0, calcCameraZ(height));

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Studio Environment & Key / Rim Lights
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.52;

    const keyLight = new THREE.DirectionalLight(0xdce8ff, 2.2);
    keyLight.position.set(-width * 0.4, height * 0.5, 600);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.15);
    rimLight.position.set(width * 0.45, -height * 0.4, 400);
    scene.add(rimLight);

    // 3. Monolith Slab Dimensions
    const slabW = Math.min(width * 0.92, 1560);
    const slabH = Math.min(height * 0.86, 880);
    const S = slabW / 1600;

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 4. Nine Precision Non-Overlapping Radial Fracture Shards
    // Coordinates in normalized slab space [0..1, 0..1]
    const basePts = {
      BL: { x: 0, y: 0 },
      B0: { x: 0.31, y: 0 },
      B1: { x: 0.69, y: 0 },
      BR: { x: 1, y: 0 },
      R0: { x: 1, y: 0.48 },
      TR: { x: 1, y: 1 },
      T1: { x: 0.72, y: 1 },
      T0: { x: 0.28, y: 1 },
      TL: { x: 0, y: 1 },
      L0: { x: 0, y: 0.52 },
      // 4 Inner Core Junctions surrounding CampusLink.register
      J0: { x: 0.28, y: 0.34 },
      J1: { x: 0.72, y: 0.34 },
      J2: { x: 0.74, y: 0.68 },
      J3: { x: 0.26, y: 0.68 },
    };

    // 9 Closed polygons forming a complete, seamless partition
    const cellDefs = [
      ['J0', 'J1', 'J2', 'J3'],         // 0: Center Core (CampusLink.register + Loading Bar)
      ['T0', 'J3', 'J2', 'T1'],         // 1: Top-Center
      ['T1', 'J2', 'R0', 'TR'],         // 2: Top-Right
      ['J1', 'R0', 'J2'],               // 3: Right-Center
      ['B1', 'BR', 'R0', 'J1'],         // 4: Bottom-Right
      ['B0', 'B1', 'J1', 'J0'],         // 5: Bottom-Center
      ['BL', 'B0', 'J0', 'L0'],         // 6: Bottom-Left
      ['L0', 'J0', 'J3'],               // 7: Left-Center
      ['TL', 'L0', 'J3', 'T0'],         // 8: Top-Left
    ];

    // High-DPI 2D Master Canvas for Glass Face Artwork & Animated Loading Bar
    const dpr = 2;
    const artCanvas = document.createElement('canvas');
    artCanvas.width = Math.max(1, Math.floor(slabW * dpr));
    artCanvas.height = Math.max(1, Math.floor(slabH * dpr));
    const artCtx = artCanvas.getContext('2d');
    artCtx.scale(dpr, dpr);

    const masterTexture = new THREE.CanvasTexture(artCanvas);
    masterTexture.colorSpace = THREE.SRGBColorSpace;

    // Draw the branding, telemetry, and live filling loading bar
    const renderArtwork = (progress) => {
      artCtx.clearRect(0, 0, slabW, slabH);

      const pad = Math.max(18, 28 * S);
      // Outer architectural border & '+' crosshairs
      artCtx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      artCtx.lineWidth = 1;
      artCtx.strokeRect(pad, pad, slabW - pad * 2, slabH - pad * 2);

      artCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      artCtx.font = `500 ${Math.max(10, 12 * S)}px "JetBrains Mono", monospace`;
      artCtx.textAlign = 'center';
      artCtx.textBaseline = 'middle';
      const corners = [
        [pad, pad],
        [slabW - pad, pad],
        [pad, slabH - pad],
        [slabW - pad, slabH - pad],
      ];
      for (const [x, y] of corners) {
        artCtx.fillText('+', x, y);
      }

      // Top Telemetry Bar
      const topY = pad + Math.max(22, 28 * S);
      artCtx.font = `500 ${Math.max(9.5, 11 * S)}px "JetBrains Mono", monospace`;
      artCtx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      artCtx.textAlign = 'left';
      artCtx.fillText('SYS.INIT // BPUT PS10 PLACEMENT PLATFORM', pad + 20, topY);

      artCtx.textAlign = 'right';
      artCtx.fillStyle = progress >= 1.0 ? '#36D67E' : 'rgba(245, 158, 11, 0.9)';
      artCtx.fillText(
        progress >= 1.0
          ? '● ENGINE ONLINE · SHATTERING...'
          : `● INITIALIZING ENGINE [${Math.round(progress * 100)}%]`,
        slabW - pad - 20,
        topY
      );

      // Centerpiece Eyebrow
      const centerY = slabH * 0.44;
      artCtx.textAlign = 'center';
      artCtx.font = `600 ${Math.max(10, 12 * S)}px "JetBrains Mono", monospace`;
      artCtx.fillStyle = 'rgba(255, 255, 255, 0.48)';
      artCtx.fillText(
        'AUTONOMOUS PLACEMENT & SEMANTIC MATCHING ENGINE',
        slabW * 0.5,
        centerY - Math.max(54, 76 * S)
      );

      // Monumental Brand Title: "CampusLink.register"
      const titleSize = Math.min(slabW * 0.082, slabH * 0.19);
      artCtx.font = `600 ${titleSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;

      const mainWord = 'CampusLink';
      const suffixWord = '.register';
      const mainWidth = artCtx.measureText(mainWord).width;

      artCtx.font = `500 ${titleSize * 0.44}px "JetBrains Mono", monospace`;
      const suffixWidth = artCtx.measureText(suffixWord).width;

      const totalWidth = mainWidth + suffixWidth + 8 * S;
      const startX = (slabW - totalWidth) * 0.5;

      // "CampusLink" metallic vertical gradient
      artCtx.font = `600 ${titleSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      artCtx.textAlign = 'left';
      const titleGrad = artCtx.createLinearGradient(
        0,
        centerY - titleSize * 0.6,
        0,
        centerY + titleSize * 0.4
      );
      titleGrad.addColorStop(0, '#FFFFFF');
      titleGrad.addColorStop(0.55, '#E4E4E7');
      titleGrad.addColorStop(1, '#9CA3AF');
      artCtx.fillStyle = titleGrad;
      artCtx.fillText(mainWord, startX, centerY);

      // ".register" in warm amber gold
      artCtx.font = `600 ${titleSize * 0.44}px "JetBrains Mono", monospace`;
      artCtx.fillStyle = '#F59E0B';
      artCtx.fillText(suffixWord, startX + mainWidth + 8 * S, centerY - titleSize * 0.04);

      // Subtitle
      artCtx.textAlign = 'center';
      artCtx.font = `400 ${Math.max(13, 16 * S)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      artCtx.fillStyle = 'rgba(255, 255, 255, 0.58)';
      artCtx.fillText(
        'Every shortlist, readiness score, and conflict-free interview slot — explained.',
        slabW * 0.5,
        centerY + Math.max(44, 58 * S)
      );

      // LIVE ANIMATED LOADING PROGRESS BAR (Keeps our signature sleek loader!)
      const barW = Math.max(260, 360 * S);
      const barH = 3.5;
      const barX = (slabW - barW) * 0.5;
      const barY = centerY + Math.max(74, 98 * S);

      // Background Track
      artCtx.beginPath();
      artCtx.roundRect(barX, barY, barW, barH, 999);
      artCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      artCtx.fill();

      // Filling Animated Progress Bar
      const fillW = barW * Math.min(1.0, Math.max(0.02, progress));
      artCtx.beginPath();
      artCtx.roundRect(barX, barY, fillW, barH, 999);
      const barGrad = artCtx.createLinearGradient(barX, 0, barX + fillW, 0);
      barGrad.addColorStop(0, '#F59E0B');
      barGrad.addColorStop(1, '#FBBF24');
      artCtx.fillStyle = barGrad;
      artCtx.fill();

      // Loading Status Monospace Label
      artCtx.font = `500 ${Math.max(10, 11.5 * S)}px "JetBrains Mono", monospace`;
      artCtx.fillStyle = 'rgba(255, 255, 255, 0.46)';
      const statusMsg =
        progress < 0.35
          ? 'Institutional Placement Register · Initializing...'
          : progress < 0.70
          ? 'Synthesizing Explainable Matching Embeddings...'
          : progress < 0.98
          ? 'Interval Overlap Scheduling Matrix Ready'
          : 'Placement Gateway Online · Fracturing Glass...';
      artCtx.fillText(statusMsg, slabW * 0.5, barY + 22);

      // Bottom Trigger Pill Hint
      const pillW = Math.max(260, 320 * S);
      const pillH = Math.max(34, 40 * S);
      const pillX = (slabW - pillW) * 0.5;
      const pillY = slabH * 0.82;

      artCtx.beginPath();
      artCtx.roundRect(pillX, pillY, pillW, pillH, 999);
      artCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      artCtx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      artCtx.lineWidth = 1;
      artCtx.fill();
      artCtx.stroke();

      artCtx.font = `600 ${Math.max(10, 11.5 * S)}px "JetBrains Mono", monospace`;
      artCtx.fillStyle = '#FFFFFF';
      artCtx.fillText('CLICK ANYWHERE TO SHATTER →', slabW * 0.5, pillY + pillH * 0.52);

      // Bottom Footer Specs
      const botY = slabH - pad - Math.max(16, 20 * S);
      artCtx.font = `500 ${Math.max(9, 10.5 * S)}px "JetBrains Mono", monospace`;
      artCtx.fillStyle = 'rgba(255, 255, 255, 0.32)';
      artCtx.textAlign = 'left';
      artCtx.fillText('© BPUT CAMPUSLINK REGISTER · ODISHA', pad + 20, botY);
      artCtx.textAlign = 'right';
      artCtx.fillText('REAL-TIME 3D CRYSTALLINE SHATTER', slabW - pad - 20, botY);

      masterTexture.needsUpdate = true;
    };

    // Render initial frame at 0%
    renderArtwork(0.0);

    const makeGlassMaterial = () => {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#141419'),
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.85,
        clearcoatRoughness: 0.10,
        specularIntensity: 0.85,
        iridescence: 0.65,
        iridescenceIOR: 1.32,
        iridescenceThicknessRange: [240, 640],
        envMapIntensity: 1.15,
      });
    };

    // Construct 9 3D Glass Shards
    const shards = cellDefs.map((keys, idx) => {
      const polyPts = keys.map((k) => ({
        x: (basePts[k].x - 0.5) * slabW,
        y: (basePts[k].y - 0.5) * slabH,
      }));

      // Centroid
      let cx = 0, cy = 0;
      for (const p of polyPts) {
        cx += p.x;
        cy += p.y;
      }
      cx /= polyPts.length;
      cy /= polyPts.length;

      // Local coordinates centered around centroid
      const localPts = polyPts.map((p) => ({ x: p.x - cx, y: p.y - cy }));
      const { shape: localShape } = createRoundedPolygonShape(localPts, 5.5 * S, 14 * S);

      const depth = 14 * S;
      const extrudeGeo = new THREE.ExtrudeGeometry(localShape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 2.6 * S,
        bevelSize: 2.4 * S,
        bevelSegments: 3,
        curveSegments: 8,
      });

      const glassMat = makeGlassMaterial();
      const glassMesh = new THREE.Mesh(extrudeGeo, glassMat);
      glassMesh.userData.shardIndex = idx;

      // Printed Typography Face mapped exactly to master slab UV coordinates
      const faceGeo = new THREE.ShapeGeometry(localShape, 8);
      const posAttr = faceGeo.attributes.position;
      const uvs = new Float32Array(posAttr.count * 2);
      for (let i = 0; i < posAttr.count; i++) {
        const wx = posAttr.getX(i) + cx;
        const wy = posAttr.getY(i) + cy;
        uvs[i * 2] = wx / slabW + 0.5;
        uvs[i * 2 + 1] = wy / slabH + 0.5;
      }
      faceGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

      const faceMat = new THREE.MeshBasicMaterial({
        map: masterTexture,
        transparent: true,
        depthWrite: false,
      });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.position.z = depth + 2.8 * S;

      const group = new THREE.Group();
      group.position.set(cx, cy, 0);
      group.add(glassMesh);
      group.add(faceMesh);
      rootGroup.add(group);

      const angle = Math.atan2(cy, cx);
      const dist = Math.hypot(cx, cy);

      return {
        idx,
        group,
        glassMesh,
        glassMat,
        faceGeo,
        extrudeGeo,
        centroid: { x: cx, y: cy },
        zPos: 0,
        zVel: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        // Shatter explosion kinematics
        vx: Math.cos(angle) * (340 + dist * 0.95) * S,
        vy: Math.sin(angle) * (320 + dist * 0.85) * S + 140 * S,
        vz: (620 + Math.random() * 380) * S,
        avx: (Math.random() - 0.5) * 5.4,
        avy: (Math.random() - 0.5) * 5.4,
        avz: (Math.random() - 0.5) * 3.6,
        delay: idx === 0 ? 0 : 0.02 * idx,
      };
    });

    // Interaction & Animation Loop State
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(0, 0);
    let pointerActive = false;
    let hoveredIdx = -1;
    let isShattering = false;
    let shatterElapsed = 0;
    let introElapsed = 0;
    const LOAD_DURATION = 1.15; // 1.15s loading phase before automatic glass shatter

    const handlePointerMove = (e) => {
      pointerActive = true;
      pointerNDC.x = (e.clientX / width) * 2 - 1;
      pointerNDC.y = -(e.clientY / height) * 2 + 1;
    };

    const handlePointerLeave = () => {
      pointerActive = false;
      hoveredIdx = -1;
    };

    // The Glass Shatter Explosion Trigger
    shatterTriggerRef.current = (clickX = width * 0.5, clickY = height * 0.5) => {
      if (isShattering) return;
      isShattering = true;
      setShattering(true);

      const impactX = clickX - width * 0.5;
      const impactY = -(clickY - height * 0.5);

      shards.forEach((s) => {
        const dx = s.centroid.x - impactX;
        const dy = s.centroid.y - impactY;
        const angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);
        s.vx = Math.cos(angle) * (380 + dist * 1.1) * S + (Math.random() - 0.5) * 140 * S;
        s.vy = Math.sin(angle) * (340 + dist * 0.95) * S + 160 * S;
        s.vz = (640 + Math.random() * 420) * S;
      });
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        shatterTriggerRef.current(width * 0.5, height * 0.5);
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.position.z = calcCameraZ(height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      introElapsed += dt;

      if (!isShattering) {
        // 1. Advance loading progress
        const progress = Math.min(1.0, introElapsed / LOAD_DURATION);
        renderArtwork(progress);

        // 2. Automatically trigger glass shatter as soon as load completes!
        if (introElapsed >= LOAD_DURATION) {
          shatterTriggerRef.current(width * 0.5, height * 0.5);
        }

        // Global block tilt toward pointer
        const targetRotY = pointerActive
          ? THREE.MathUtils.degToRad(pointerNDC.x * 6.5)
          : 0;
        const targetRotX = pointerActive
          ? THREE.MathUtils.degToRad(-pointerNDC.y * 5.0)
          : 0;
        rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, targetRotY, 6, dt);
        rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetRotX, 6, dt);

        // Raycast to find hovered shard
        if (pointerActive) {
          raycaster.setFromCamera(pointerNDC, camera);
          const hits = raycaster.intersectObjects(shards.map((s) => s.glassMesh));
          hoveredIdx = hits.length > 0 ? hits[0].object.userData.shardIndex : -1;
        } else {
          hoveredIdx = -1;
        }

        // Spring hover physics for shards
        shards.forEach((s) => {
          const isHovered = s.idx === hoveredIdx;
          const targetZ = isHovered ? 42 * S : 0;

          // Spring physics (k=180, c=18)
          const force = 180 * (targetZ - s.zPos) - 18 * s.zVel;
          s.zVel += force * dt;
          s.zPos += s.zVel * dt;
          s.group.position.z = s.zPos;

          // Lift & tip shard on hover
          let targetRx = 0;
          let targetRy = 0;
          if (isHovered) {
            targetRy = THREE.MathUtils.clamp(pointerNDC.x * 0.16, -0.22, 0.22);
            targetRx = THREE.MathUtils.clamp(-pointerNDC.y * 0.16, -0.22, 0.22);
          }
          s.rx = THREE.MathUtils.damp(s.rx, targetRx, 10, dt);
          s.ry = THREE.MathUtils.damp(s.ry, targetRy, 10, dt);
          s.group.rotation.set(s.rx, s.ry, 0);

          s.glassMat.iridescence = THREE.MathUtils.damp(
            s.glassMat.iridescence,
            isHovered ? 1.0 : 0.65,
            8,
            dt
          );
          s.glassMat.envMapIntensity = THREE.MathUtils.damp(
            s.glassMat.envMapIntensity,
            isHovered ? 1.9 : 1.15,
            8,
            dt
          );
        });
      } else {
        // 3D Glass Shatter Physics Sequence
        shatterElapsed += dt;
        shards.forEach((s) => {
          const t = Math.max(0, shatterElapsed - s.delay);
          if (t <= 0) return;

          s.vy -= 980 * S * dt; // Gravity pulling downward
          s.group.position.x += s.vx * dt;
          s.group.position.y += s.vy * dt;
          s.group.position.z += s.vz * dt;

          s.group.rotation.x += s.avx * dt;
          s.group.rotation.y += s.avy * dt;
          s.group.rotation.z += s.avz * dt;
        });

        // After 0.85s of glass shatter physics, unmount completely
        if (shatterElapsed >= 0.85) {
          setShow(false);
          return;
        }
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      shards.forEach((s) => {
        s.extrudeGeo.dispose();
        s.faceGeo.dispose();
        s.glassMat.dispose();
      });
      masterTexture.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      onClick={(e) => handleShatter(e.clientX, e.clientY)}
      className={`fixed inset-0 z-[100] cursor-pointer select-none transition-colors duration-400 ${
        shattering ? 'bg-transparent pointer-events-none' : 'bg-[#050507]'
      }`}
      aria-label="CampusLink Intro Glass Vault — Loading and shattering into register"
    >
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
